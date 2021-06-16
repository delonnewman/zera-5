import {
    Symbol,
    isSymbol,
    isString,
    isKeyword,
    Keyword,
    keyword,
    isMap,
    arrayMap,
    HashSet,
    list,
    Vector,
    AMeta,
    withMeta,
    isSeq,
    AReference,
    key,
    val,
    THE_VAR,
    QUOTE_SYM,
    DEREF_SYM
} from "./runtime";

import { PushBackReader } from "./reader/PushBackReader";

type Options = { [key: string]: any };

function stringReader(r: PushBackReader): string {
    var firstline = r.line();
    var buff = [];

    var ch;
    for (ch = r.read(); ch !== '"'; ch = r.read()) {
        if (ch == null) throw new Error("EOF while reading, starting at line: " + firstline);
        if (ch === "\\") {
            // escape
            ch = r.read();
            if (ch == null) throw new Error("EOF while reading, starting at line: " + firstline);
            switch (ch) {
                case "t":
                    ch = "\t";
                    break;
                case "r":
                    ch = "\r";
                    break;
                case "n":
                    ch = "\n";
                    break;
                case "\\":
                    break;
                case '"':
                    break;
                case "b":
                    ch = "\b";
                    break;
                case "f":
                    ch = "\f";
                    break;
                case "u":
                    // TODO: add Unicode support
                    throw new Error("Don't know how to read unicode yet");
                default:
                    // TODO: complete this
                    throw new Error("Unsupported escape character: " + ch);
            }
        }
        buff.push(ch);
    }
    return buff.join("");
}

function commentReader(r: PushBackReader): PushBackReader {
    var ch;

    do {
        ch = r.read();
    } while (ch !== null && ch !== "\n" && ch !== "\r");

    return r;
}

function readDelimitedList(delim: string, r: PushBackReader, isRecursive: boolean, opts: Options): any[] {
    var firstline = r.line();
    var a = [];

    while (true) {
        var ch = r.read();
        if (ch == null) throw new Error("EOF while reading, starting at line: " + firstline);

        while (isWhitespace(ch)) {
            ch = r.read();
            if (ch == null) throw new Error("EOF while reading, starting at line: " + firstline);
        }

        if (ch === delim) break;

        var macrofn = getMacro(ch);
        if (macrofn !== null) {
            var ret = macrofn.call(null, r, ch, opts);
            // no op macros return the reader
            if (ret !== r) a.push(ret);
        } else {
            r.unread(ch);
            var x = _read(r, true, null, isRecursive, opts);
            if (x !== r) a.push(x);
        }
    }

    return a;
}

function listReader(r: PushBackReader, openparen: string, opts: Options): any {
    var meta = arrayMap(LINE_KEY, r.line(), COLUMN_KEY, r.column());

    var a = readDelimitedList(")", r, true, opts);

    return list.apply(null, a).withMeta(meta);
}

function unmatchedDelimiterReader(r: PushBackReader, delim: string, opts: Options) {
    throw new Error("Unmatched delimiter: " + delim);
}

function vectorReader(r: PushBackReader, openbracket: string, opts: Options) {
    var a = readDelimitedList("]", r, true, opts);
    return new Vector(null, a);
}

function mapReader(r: PushBackReader, openbracket: string, opts: Options) {
    var a = readDelimitedList("}", r, true, opts);
    return arrayMap.apply(null, a);
}

function characterReader(r: PushBackReader, slash: string, opts: Options) {
    var firstline = r.line();
    var ch = r.read();
    if (ch == null) throw new Error("EOF while reading, starting at line: " + firstline);

    var token = readToken(r, ch, false);

    if (token.length === 1) return token;
    else if (token === "newline") return "\n";
    else if (token === "space") return " ";
    else if (token === "tab") return "\t";
    else if (token === "backspace") return "\b";
    else if (token === "formfeed") return "\f";
    else if (token === "return") return "\r";
    else if (token.startsWith("u")) {
        throw new Error("Don't know how to read unicode characters");
    } else if (token.startsWith("o")) {
        throw new Error("Don't know how to read octal characters");
    }
}

function metaReader(r: PushBackReader, hat: string, opts: Options) {
    var line = r.line();
    var column = r.column();
    var meta = _read(r, true, null, true, opts);

    // FIXME: we probably don't have any use for tags
    if (isSymbol(meta) || isString(meta)) {
        meta = arrayMap(TAG_KEY, meta);
    }
    else if (isKeyword(meta)) {
        meta = arrayMap(meta, true);
    }
    else if (!isMap(meta)) {
        throw new Error("Metadata must be a Symbol, Keyword, String or Map");
    }

    var x = _read(r, true, null, true, opts);

    if (x instanceof AMeta) {
        if (isSeq(x)) {
            meta = meta.assoc([LINE_KEY, line, COLUMN_KEY, column]);
        }

        if (x instanceof AReference) {
            x.resetMeta(meta);
            return x;
        }

        var xmeta = x.meta() || arrayMap();
        for (var s = meta.entries(); s !== null; s = s.next()) {
            var kv = s.first();
            xmeta = xmeta.assoc(key(kv), val(kv));
        }

        return withMeta(x, xmeta);
    }
    else {
        throw new Error("Metadata can only be applied to IMetas");
    }
}

function dispatchReader(r: PushBackReader, hash: string, opts: Options) {
    var firstline = r.line();
    var ch = r.read();
    if (ch == null) throw new Error("EOF while reading, starting at line: " + firstline);

    var fn = DISPATCH_MACROS[ch];
    if (fn == null) {
        // TODO: implement taggedReader
        /*if (ch.match(/[A-Za-z]{1,1}/)) {
            r.unread(ch);
            return taggedReader.call(null, ch, opts);
        }*/
        throw new Error("No dispatch macro for: " + ch);
    }

    return fn.call(null, r, ch, opts);
}

function wrappingReader(sym: Symbol) {
    return function(r: PushBackReader, quote: string, opts: Options) {
        var x = _read(r, true, null, true, opts);
        return list(sym, x);
    };
}

function varReader(r: PushBackReader, quote: string, opts: Options) {
    var x = _read(r, true, null, true, opts);
    return list(THE_VAR, x);
}

function setReader(r: PushBackReader, leftbracket: string, opts: Options) {
    return HashSet.createFromArray(readDelimitedList("}", r, true, opts));
}

var MACROS: { [key: string]: any } = {
    '"': stringReader,
    ";": commentReader,
    "'": wrappingReader(QUOTE_SYM),
    "@": wrappingReader(DEREF_SYM),
    "^": metaReader,
    "(": listReader,
    ")": unmatchedDelimiterReader,
    "[": vectorReader,
    "]": unmatchedDelimiterReader,
    "{": mapReader,
    "}": unmatchedDelimiterReader,
    "\\": characterReader,
    "#": dispatchReader,
};

// TODO: implement dispatch macros
var DISPATCH_MACROS: { [key: string]: Function } = {
    "^": metaReader,
    "'": varReader,
    "{": setReader,
};

function isWhitespace(ch: string): boolean {
    if (ch == null) return false;

    return ch === "," || ch.match(/^\s$/) != null;
}

function isDigit(ch: string): boolean {
    return ch.match(/^\d$/) != null;
}

function isMacro(ch: string): boolean {
    return MACROS[ch] != null;
}

function isTerminatingMacro(ch: string): boolean {
    return ch !== "#" && ch !== "'" && isMacro(ch);
}

function getMacro(ch: string): any {
    var m = MACROS[ch];
    if (m != null) return m;

    return null;
}

export function readString(str: string): any {
    var r = new PushBackReader(str);
    var res, ret;

    while (true) {
        res = read(r, { eofIsError: false, eofValue: { $zera$eof: true } });
        if (res.$zera$eof !== true) ret = res;
        if (res.$zera$eof === true) return ret;
    }

    return ret;
}

function readNumber(r: PushBackReader, initch: string) {
    var firstline = r.line();
    var buff = [initch];

    while (true) {
        var ch = r.read();
        if (ch == null) throw new Error("EOF while reading, starting at line: " + firstline);

        if (isWhitespace(ch) || isMacro(ch)) {
            r.unread(ch);
            break;
        }

        buff.push(ch);
    }

    var s = buff.join("");
    var n = matchNumber(s);

    if (n === null) throw new Error("Invalid number: " + s);
    return n;
}

// TODO: add decimals, _'s, scientific notation, rationals?
function matchNumber(s: any): number | null {
    var m = s.match(/(\-|\+)?\d+/);

    if (m !== null) {
        return 1 * s;
    }

    return null;
}

function nonConstituent(ch: string): boolean {
    return ch === "@" || ch === "`" || ch === "~";
}

function readToken(r: PushBackReader, initch: string, leadConstituent: boolean) {
    if (leadConstituent && nonConstituent(initch)) {
        throw new Error("Invalid leading character: " + initch);
    }

    var firstline = r.line();

    var buff = [initch];
    while (true) {
        var ch = r.read();
        if (ch == null) throw new Error("EOF while reading, starting at line: " + firstline);

        if (isWhitespace(ch) || isTerminatingMacro(ch)) {
            r.unread(ch);
            return buff.join("");
        }
        else if (nonConstituent(ch)) {
            throw new Error("Invalid constituent character: " + ch);
        }

        buff.push(ch);
    }
}

function matchSymbol(s: string): Symbol | Keyword {
    if (s.charAt(0) === ":") {
        return Keyword.intern(Symbol.intern(s.substring(1)));
    }
    else if (s.endsWith("#")) {
        return Symbol.intern(s).withMeta(arrayMap(keyword("autosym"), true));
    }

    return Symbol.intern(s);
}

function interpretToken(s: string): any {
    if (s === "nil") {
        return null;
    }
    else if (s === "true") {
        return true;
    }
    else if (s === "false") {
        return false;
    }

    var ret = matchSymbol(s);
    if (ret !== null) return ret;

    throw new Error("Invalid token: " + s);
}

export function read(r: PushBackReader, opts: Options) {
    var eofIsError = true;
    var eofValue = null;
    if (opts != null) {
        eofIsError = opts.eofIsError;
        eofValue = opts.eofValue;
    }
    return _read(r, eofIsError, eofValue, false, opts);
}

function _read(r: PushBackReader, eofIsError: boolean, eofValue: any, isRecursive: boolean, opts: Options): any {
    var firstline = r.line();

    while (true) {
        var ch = r.read();
        if (ch == null) throw new Error("EOF while reading, starting at line: " + firstline);

        while (isWhitespace(ch)) {
            ch = r.read();
            if (ch == null) throw new Error("EOF while reading, starting at line: " + firstline);
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

        if (ch === "+" || ch === "-") {
            var ch2 = r.read();
            if (ch2 != null && isDigit(ch2)) {
                r.unread(ch2);
                return readNumber(r, ch);
            }
            if (ch2 != null) r.unread(ch2);
        }

        var token = readToken(r, ch, true);
        return interpretToken(token);
    }
}
