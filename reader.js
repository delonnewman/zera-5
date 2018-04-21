var zera = zera || {};
zera.reader = (function() {
    "use strict";

    var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    var isBrowser = typeof window !== 'undefined';

    if (isNode) {
        zera = require('./zera.js');
    }

    function PushBackReader(str) {
        this.limit  = str.length - 1;
        this.stream = str.split('');
        this.position = 0;
        this._line = 1;
        this._column = 1;
    }

    PushBackReader.prototype.line = function() {
        return this._line;
    };

    PushBackReader.prototype.column = function() {
        return this._column;
    };

    PushBackReader.prototype.read = function() {
        if (this.position > this.limit) return null;
        var ch = this.stream[this.position];
        this.position++;
        if (ch === '\n') {
            this._column = 1;
            this._line++;
        }
        else {
            this._column++;
        }
        return ch;
    };

    PushBackReader.prototype.skip = function(n) {
        this.position += n;
    };

    PushBackReader.prototype.reset = function() {
        this.position = 0;
    };

    PushBackReader.prototype.unread = function(ch) {
        this.position -= 1;
        this.stream[this.position] = ch;
    };

    function stringReader(r, doublequote, opts) {
        var buff = [];
    
        var ch;
        for (ch = r.read(); ch !== '"'; ch = r.read()) {
            if (ch === null) throw new Error('EOF while reading string');
            if (ch === '\\') { // escape
                ch = r.read();
                if (ch === null) throw new Error('EOF while reading string');
                switch (ch) {
                    case 't':
                        ch = '\t';
                        break;
                    case 'r':
                        ch = '\r';
                        break;
                    case 'n':
                        ch = '\n';
                        break;
                    case '\\':
                        break;
                    case '"':
                        break;
                    case 'b':
                        ch = '\b';
                        break;
                    case 'f':
                        ch = '\f';
                        break;
                    case 'u':
                        // TODO: add Unicode support
                        throw new Error("Don't know how to read unicode yet");
                    default:
                        // TODO: complete this
                        throw new Error("Unsupported escape character: " + ch);
                }
            }
            buff.push(ch);
        }
        return buff.join('');
    }

    function commentReader(r, semicolon, opts) {
        var ch;
        do {
            ch = r.read();
        } while (ch !== null && ch !== '\n' && ch !== '\r');
        return r;
    }

    function readDelimitedList(delim, r, isRecursive, opts) {
        var firstline = r.line();
        var a = [];

        while (true) {
            var ch = r.read();
            while (isWhitespace(ch)) ch = r.read();
            
            if (ch === null) {
                throw new Error('EOF while reading, starting at line: ' + firstline);
            }

            if (ch === delim) break;

            var macrofn = getMacro(ch);
            if (macrofn !== null) {
                var ret = macrofn.call(null, r, ch, opts);
                // no op macros return the reader
                if (ret !== r) a.push(ret);
            }
            else {
                r.unread(ch);
                var x = read(r, true, null, isRecursive, opts);
                if (x !== r) a.push(x);
            }
        }

        return a;
    }

    function listReader(r, openparen, opts) {
        var a = readDelimitedList(')', r, true, opts);
        return zera.list.apply(null, a);
    }

    function unmatchedDelimiterReader(r, delim, opts) {
        throw new Error('Unmatched delimiter: ' + delim);
    }

    function vectorReader(r, openbracket, opts) {
        return readDelimitedList(']', r, true, opts);
    }

    function mapReader(r, openbracket, opts) {
        var a = readDelimitedList('}', r, true, opts);
        return zera.arrayMap.apply(null, a);
    }

    function characterReader(r, slash, opts) {
        var ch = r.read();
        if (ch === null) throw new Error('EOF while reading character');
        var token = readToken(r, ch, false);
        if (token.length === 1) return token;
        else if (token === 'newline') return '\n';
        else if (token === 'space') return ' ';
        else if (token === 'tab') return '\t';
        else if (token === 'backspace') return '\b';
        else if (token === 'formfeed') return '\f';
        else if (token === 'return') return '\r';
        else if (token.startsWith('u')) {
            throw new Error("Don't know how to read unicode characters");
        }
        else if (token.startsWith('o')) {
            throw new Error("Don't know how to read octal characters");
        }
    }

    var TAG_KEY    = zera.Keyword.intern('tag');
    var LINE_KEY   = zera.Keyword.intern('line');
    var COLUMN_KEY = zera.Keyword.intern('colunm');

    function metaReader(r, hat, opts) {
        var line = r.line();
        var column = r.column();
        var meta = read(r, true, null, true, opts);
        // FIXME: we probably don't have any use for tags
        if (zera.isSymbol(meta) || zera.isString(meta)) {
            meta = zera.arrayMap(TAG_KEY, meta);
        }
        else if (zera.isKeyword(meta)) {
            meta = zera.arrayMap(meta, true);
        }
        else if (!zera.isMap(meta)) {
            throw new Error('Metadata must be a Symbol, Keyword, String or Map');
        }
        
        var x = read(r, true, null, true, opts);
        if (x instanceof zera.IMeta) {
            if (zera.isSeq(x)) {
                meta = meta.assoc([LINE_KEY, line, COLUMN_KEY, column]);
            }
            if (x instanceof zera.AReference) {
                x.resetMeta(meta);
                return x;
            }

            var xmeta = x.meta();
            for (var s = meta.entries(); s !== null; s = s.next()) {
                var kv = s.first();
                xmeta = xmeta.assoc([kv.key(), kv.val()]);
            }
            return x.withMeta(xmeta);
        }
        else {
            throw new Error('Metadata can only be applied to IMetas');
        }
    }

    function dispatchReader(r, hash, opts) {
        var ch = r.read();
        if (ch === null) throw new Error('EOF while reading character');
        var fn = DISPATCH_MACROS[ch];

        if (fn == null) {
            // TODO: implement taggedReader
            /*if (ch.match(/[A-Za-z]{1,1}/)) {
                r.unread(ch);
                return taggedReader.call(null, ch, opts);
            }*/
            throw new Error('No dispatch macro for: ' + ch);
        }
        return fn.call(null, r, ch, opts);
    }

    var MACROS = {
        '"': stringReader,
        ';': commentReader,
        '^': metaReader,
        '(': listReader,
        ')': unmatchedDelimiterReader,
        '[': vectorReader,
        ']': unmatchedDelimiterReader,
        '{': mapReader,
        '}': unmatchedDelimiterReader,
        '\\': characterReader,
        '#': dispatchReader
    };

    // TODO: implement dispatch macros
    var DISPATCH_MACROS = {
    };

    function isWhitespace(ch) {
        if (ch == null) return false;
        return ch === ',' || ch.match(/^\s$/);
    }

    function isDigit(ch) {
        return ch.match(/^\d$/);
    }

    function isMacro(ch) {
        return !!MACROS[ch];
    }

    function isTerminatingMacro(ch) {
        return (ch !== '#' && ch !== '\'' && isMacro(ch));
    }

    function getMacro(ch) {
        var m = MACROS[ch];
        if (m != null) return m;
        return null;
    }

    function readString(str, opts) {
        var r = new PushBackReader(str);
        return read(r, opts);
    }

    function readNumber(r, initch) {
        var buff = [initch];

        while(true) {
            var ch = r.read();
            if (ch === null || isWhitespace(ch) || isMacro(ch)) {
                r.unread(ch);
                break;
            }
            buff.push(ch);
        }

        var s = buff.join('');
        var n = matchNumber(s);
        if (n === null) throw new Error('Invalid number: ' + s);
        return n;
    }

    // TODO: add decimals, _'s, scientific notation, rationals?
    function matchNumber(s) {
        var m = s.match(/(\-|\+)?\d+/);
        if (m !== null) {
            return 1*s;
        }
        return null;
    }

    function nonConstituent(ch) {
        return ch === '@' || ch === '`' || ch === '~';
    }

    function readToken(r, initch, leadConstituent) {
        if (leadConstituent && nonConstituent(initch)) {
            throw new Error('Invalid leading character: ' + initch);
        }

        var buff = [initch];
        while(true) {
            var ch = r.read();
            if (ch === null || isWhitespace(ch) || isTerminatingMacro(ch)) {
                r.unread(ch);
                return buff.join('');
            }
            else if (nonConstituent(ch)) {
                throw new Error('Invalid constituent character: ' + ch);
            }
            buff.push(ch);
        }
    }

    function matchSymbol(s) {
        if (s.charAt(0) === ':') {
            return zera.Keyword.intern(zera.Symbol.intern(s.substring(1)));
        }
        return zera.Symbol.intern(s);
    }

    function interpretToken(s) {
        if (s === 'nil') {
            return null;
        }
        else if (s === 'true') {
            return true;
        }
        else if (s === 'false') {
            return false;
        }

        var ret = matchSymbol(s);
        if (ret !== null) return ret;
        throw new Error('Invalid token: ' + s);
    }

    function read(r, eofIsError, eofValue, isRecursive, opts) {
        while (true) {
            var ch = r.read();

            while (isWhitespace(ch)) ch = r.read();
            if (ch === null) {
                if (eofIsError) throw new Error('EOF while reading');
                return eofValue;
            }

            if (isDigit(ch)) {
                var n = readNumber(r, ch);
                return n;
            }

            var macrofn = getMacro(ch);
            if (macrofn !== null) {
                var ret = macrofn.call(null, r, ch, opts);
                if (ret === r) continue;
                return ret;
            }

            if (ch === '+' || ch === '-') {
                var ch2 = r.read();
                if (isDigit(ch2)) {
                    r.unread(ch2);
                    return readNumber(r, ch);
                }
                r.unread(ch2);
            }

            var token = readToken(r, ch, true);
            return interpretToken(token);
        }
    }

    return {
        PushBackReader: PushBackReader,
        readString: readString,
        readDelimitedList: readDelimitedList
    };

}());
