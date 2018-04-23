// jshint esversion: 5
// jshint eqnull: true
// jshint evil: true

var zera = (function() {
    "use strict";

    var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    var isBrowser = typeof window !== 'undefined';

    // TODO: add sets, and vectors

    function IMeta(){}
    IMeta.prototype.meta = function() {
        throw new Error('unimplemented');
    };

    function meta(x) {
        if (x == null) return null;
        else if (isJSFn(x.meta)) {
            return x.meta();
        }
        else {
            throw new Error("Don't now how to get metadata from: " + x);
        }
    }

    function IObj(){}
    IObj.prototype = Object.create(IMeta.prototype);
    IObj.prototype.withMeta = function(meta) {
        throw new Error('unimplemented');
    };

    function withMeta(x, meta) {
        if (x == null) return null;
        else if (isJSFn(x.withMeta)) {
            return x.withMetaeta(meta);
        }
        else {
            throw new Error("Don't now how to add metadata to: " + x);
        }
    }

    function AReference(meta) {
        this.$zera$meta = meta;
    }

    AReference.prototype = Object.create(IMeta.prototype);

    AReference.prototype.meta = function() {
        return this.$zera$meta;
    };

    AReference.prototype.alterMeta = function(f, args) {
        this.$zera$meta = apply(f, cons(this.$zera$meta, args));
        return this.$zera$meta;
    };

    AReference.prototype.resetMeta = function(m) {
        this.$zera$meta = m;
        return m;
    };

    // TODO: complete ARef implementation
    function ARef(meta) {
        AReference.call(this);
    }

    ARef.prototype = Object.create(AReference.prototype);

    function Named(){}
    Named.prototype = Object.create(IObj.prototype);

    function Sym(ns, name, meta) {
        this.$zera$ns = ns;
        this.$zera$name = name;
        this.$zera$meta = meta || arrayMap();
    }

    Sym.prototype = Object.create(Named.prototype);

    Sym.intern = function(rep) {
        var i = rep.indexOf('/');
        if (i === -1 || rep === '/') {
            return new Sym(null, rep);
        }
        else {
            return new Sym(rep.substring(0, i), rep.substring(i + 1));
        }
    };

    Sym.prototype.name = function() {
        return this.$zera$name;
    };

    Sym.prototype.namespace = function() {
        return this.$zera$ns;
    };

    Sym.prototype.toString = function() {
        if (this.$zera$ns == null) {
            return this.$zera$name;
        }
        return s(this.$zera$ns, '/', this.$zera$name);
    };

    Sym.prototype.isNamespaceQualified = function() {
        return !!this.$zera$ns;
    };

    // IObj
    Sym.prototype.withMeta = function(meta) {
        return new Sym(this.$zera$ns, this.$zera$name, meta);
    };

    // IObj, IMeta
    Sym.prototype.meta = function() {
        return this.$zera$meta;
    };

    // Invokable
    Sym.prototype.apply = function(x, args) {
        if (args.length != 1) throw new Error('Symbols expect one and only one argument');
        if (isJSFn(args[0].apply)) {
            return args[0].apply(null, [this]);
        }
        else {
            throw new Error('Symbols expect and argument this is invokable');
        }
    };

    Sym.prototype.equals = function(o) {
        if (o == null || !isSymbol(o)) return false;
        return this.$zera$ns === o.$zera$ns && this.$zera$name === o.$zera$name;
    };

    // Symbols
    var NIL_SYM = Sym.intern('nil');
    var TRUE_SYM = Sym.intern('true');
    var FALSE_SYM = Sym.intern('false');
    var QUOTE_SYM = Sym.intern('quote');
    var DEF_SYM = Sym.intern('def');
    var SET_SYM = Sym.intern('set!');
    var FN_SYM = Sym.intern('fn');
    var COND_SYM = Sym.intern('cond');
    var LOOP_SYM = Sym.intern('loop');
    var RECUR_SYM = Sym.intern('recur');
    var THROW_SYM = Sym.intern('throw');
    var NEW_SYM = Sym.intern('new');
    var DOT_SYM = Sym.intern('.');
    var MACRO_SYM = Sym.intern('defmacro');
    var AMP_SYM = Sym.intern('&');

    var SPECIAL_FORMS = {
        'nil': true,
        'true': true,
        'false': true,
        'quote': true,
        'def': true,
        'set!': true,
        'fn': true,
        'cond': true,
        'loop': true,
        'recur': true,
        'throw': true,
        'new': true,
        '.': true,
        'defmacro': true,
        'var': true
    };

    function symbol() {
        if (arguments.length === 1) {
            return new Sym(null, arguments[0]);
        }
        else if (arguments.length === 2) {
            return new Sym(arguments[0], arguments[1]);
        }
        else {
            throw new Error(s('Wrong number of arguments (', arguments.length, ') passed to symbol'));
        }
    }

    function isSymbol(x) {
        return x instanceof Sym;
    }

    function Keyword(sym) {
        this.$zera$sym = sym;
    }

    Keyword.prototype = Object.create(Named.prototype);

    Keyword.table = {};

    Keyword.intern = function(sym_) {
        var sym = isSymbol(sym_) ? sym_ : Sym.intern(sym_);
        var kw = Keyword.table[sym];
        if (!kw) kw = Keyword.table[sym] = new Keyword(sym);
        return kw;
    };

    Keyword.prototype.name = function() {
        return this.$zera$sym.name();
    };

    Keyword.prototype.namespace = function() {
        return this.$zera$sym.namespace();
    };

    Keyword.prototype.toString = function() {
        return s(':', this.$zera$sym);
    };

    function isKeyword(x) {
        return x instanceof Keyword;
    }

    function keyword() {
        if (arguments.length === 1) {
            return Keyword.intern(new Sym(null, arguments[0]));
        }
        else if (arguments.length === 2) {
            return Keyword.intern(new Sym(arguments[0], arguments[1]));
        }
        else {
            throw new Error(s('Wrong number of arguments expected 1 or 2, got: ', arguments.length));
        }
    }

    function isNamed(x) {
        return x instanceof Named;
    }

    function name(sym) {
        if (isNamed(sym)) return sym.name();
        else {
            throw new Error(s("Don't know how to get the name of: ", prnStr(sym)));
        }
    }

    function namespace(sym) {
        if (isNamed(sym)) return sym.namespace();
        else {
            throw new Error(s("Don't know how to get the namespace of: ", prnStr(sym)));
        }
    }

    function Seq(){}

    function isSeq(x) {
        return x instanceof Seq;
    }

    function isSeqable(x) {
        if (x == null) return false;
        return isJSFn(x.seq) || isArrayLike(x);
    }

    function List(){}
    List.prototype = Object.create(Seq.prototype);

    function isList(x) {
        return x instanceof List;
    }

    // Cons

    function Cons(car, cdr) {
        this.$zera$car = car;
        this.$zera$cdr = cdr;
        if (car == null && cdr == null) {
            this.$zera$count = 0;
        }
        else if (cdr == null) {
            this.$zera$cdr = Cons.EMPTY;
            this.$zera$count = 1;
        }
        else if (!(cdr instanceof Cons)) {
            this.$zera$count = 1;
        }
        else {
            this.$zera$count = cdr.count() + 1;
        }
    }

    Cons.prototype = Object.create(Seq.prototype);

    Cons.EMPTY = new Cons(null, null);

    Cons.prototype.first = function() {
        return this.$zera$car;
    };

    Cons.prototype.rest = function() {
        return this.$zera$cdr;
    };

    Cons.prototype.count = function() {
        return this.$zera$count;
    };

    Cons.prototype.next = function() {
        var cdr = this.rest();
        return cdr instanceof Cons ? cdr.first() : cdr;
    };

    Cons.prototype.cons = function(x) {
        return new Cons(x, this);
    };

    Cons.prototype.conj = function(vals) {
        var i, xs = this;
        for (i = 0; i < vals.length; i++) {
            xs = xs.cons(vals[i]);
        }
        return xs;
    };

    Cons.prototype.isEmpty = function() {
        return this.$zera$count === 0;
    };

    Cons.prototype.isList = function() {
        return true;
    };

    Cons.prototype.equals = function(o) {
        if (o == null) {
            return false;
        }
        else if (isCons(o)) {
            var xa  = this.first();
            var xb  = o.first();
            var xsa = this.rest();
            var xsb = o.rest();
            while (!isEmpty(xsa) && !isEmpty(xsb)) {
                if (xa !== xb) {
                    return false;
                }
                else {
                    xa  = xsa.first();
                    xb  = xsb.first();
                    xsa = xsa.rest();
                    xsb = xsb.rest();
                }
            }
            return true;
        }
        else {
            return false;
        }
    };

    function cons(car, cdr) {
        return new Cons(car, cdr);
    }

    function car(cons) {
        if (cons == null) return null;
        return cons.first();
    }

    function cdr(cons) {
        if (cons == null) return null;
        return cons.rest();
    }

    function isCons(x) {
        return x instanceof Cons;
    }

    // make a list out of conses
    function list() {
        if (arguments.length === 0) {
            return Cons.EMPTY;
        }
        else if (arguments.length === 1) {
            return cons(arguments[0], Cons.EMPTY);
        }
        var i, x;
        var xs = Cons.EMPTY;
        for (i = arguments.length - 1; i >= 0; i--) {
            x = arguments[i];
            xs = cons(x, xs);
        }
        return xs;
    }

    function LazyList(seq, fn) {
        this.fn = fn == null ? null : fn;
        this._seq = seq == null ? null : seq;
        this._sv = null;
    }

    LazyList.prototype = Object.create(List.prototype);

    LazyList.prototype.sval = function() {
        if (this.fn != null) {
            this._sv = this.fn.call();
            this.fn = null;
        }
        if (this._sv != null) {
            return this._sv;
        }
        return this._seq;
    };

    LazyList.prototype.seq = function() {
        this.sval();
        if (this._sv != null) {
            var ls = this._sv;
            this._sv = null;
            while (ls instanceof LazyList) {
                ls = ls.sval();
            }
            this._seq = ls;
        }
        return this._seq;
    };

    LazyList.prototype.count = function() {
        var c = 0, s;
        for (s = this; s != null; s = s.next()) {
            c++;
        }
        return c;
    };

    LazyList.prototype.cons = function(x) {
        return cons(x, this.seq());
    };

    LazyList.prototype.first = function() {
        this.seq();
        if (this._seq == null) {
            return null;
        }
        return this._seq.first();
    };

    LazyList.prototype.next = function() {
        this.seq();
        if (this._seq == null) {
            return null;
        }
        return this._seq.next();
    };

    LazyList.prototype.rest = function() {
        var val = this.next();
        if (val == null) return Cons.EMPTY;
        else             return val;
    };

    LazyList.prototype.toString = function() {
        var buff = [];
        var seq = this, x;
        while (seq.next()) {
            x = seq.first();
            seq = seq.next();
            buff.push(prnStr(x));
        }
        return '(' + buff.join(' ') + ')'; 
    };

    function lazyList(fn) {
        return new LazyList(null, fn);
    }

    function isLazyList(x) {
        return x instanceof LazyList;
    }

    function take(n, xs) {
        if (arguments.length !== 2) {
            throw new Error(str('Wrong number of arguments expected: 2, got: ', arguments.length));
        }
        return lazyList(function() {
            if (n > 0) {
                return cons(first(xs), take(n - 1, rest(xs)));
            } else {
                return null;
            }
        });
    }

    function range(x, y, z) {
        var start, stop, step;
        if (arguments.length === 1) {
            start = 0;
            stop  = x;
            step  = 1;
        }
        else if (arguments.length === 2) {
            start = x;
            stop  = y;
            step  = 1;
        }
        else if (arguments.length === 3) {
            start = x;
            stop  = y;
            step  = z;
        }
        else {
            throw new Error(s('Expected between 1 and 3 arguments, got: ', arguments.length));
        }
        return lazyList(function() {
            if (start === stop) {
                return null;
            }
            else {
                return cons(start, range(start + step, stop, step));
            }
        });
    }

    function isPair(x) {
        return isCons(x) && !isCons(cdr(x)) && cdr(x) != null;
    }

    function isNil(x) {
        return x == null;
    }

    // Array operations

    function isArray(x) {
        return Object.prototype.toString.call(x) === '[object Array]';
    }

    function isArrayLike(x) {
        return x != null && isNumber(x.length);
    }

    function areduce(f) {
        var i, init, xs;
        if (arguments.length === 1) {
            return function(init, xs) {
                return areduce(f, init, xs);
            };
        } else if (arguments.length === 2) {
            xs = arguments[1];
            init = xs[0];
            xs = xs.slice(1);
            for (i = 0; i < xs.length; i++) {
                init = f.call(null, init, xs[i]);
            }
            return init;
        } else if (arguments.length === 3) {
            init = arguments[1];
            xs = arguments[2];
            for (i = 0; i < xs.length; i++) {
                init = f.call(null, init, xs[i]);
            }
            return init;
        } else {
            throw new Error(s('Expected between 1 and 3 arguments, got: ', arguments.length));
        }
    }

    function amap(f, xs) {
        if (arguments.length === 1) {
            return function(xs) {
                return amap(f, xs);
            };
        }
        else if (arguments.length === 2) {
            var i, a = [];
            for (i = 0; i < xs.length; i++) {
                a.push(f.call(null, xs[i]));
            }
            return a;
        }
        else {
            throw new Error(s('Expected 1 or 2 arguments, got: ', arguments.length));
        }
    }

    function afilter(f, xs) {
        if (arguments.length === 1) {
            return function(xs) {
                return afilter(f, xs);
            };
        }
        else if (arguments.length === 2) {
            var a = [], i, pred;
            for (i = 0; i < xs.length; i++) {
                pred = f.call(null, xs[i]);
                if (pred != null && pred !== false) {
                    a.push(xs[i]);
                }
            }
            return a;
        }
        else {
            throw new Error(s('Expected 1 or 2 arguments, got: ', arguments.length));
        }
    }

    function aget(a, i) {
        return a == null ? null : a[i];
    }

    function aset(a, i, v) {
        if (a != null) a[i] = v;
        return a;
    }

    function alength(a) {
        return a.length;
    }

    function intArray(x) {
        if (isNumber(x)) {
            return new Int32Array(x);
        }
        else if (isSeq(x)) {
            return new Int32Array(consToArray(x));
        }
    }

    function floatArray(x) {
        if (isNumber(x)) {
            return new Float32Array(x);
        }
        else if (isSeq(x)) {
            return new Float32Array(consToArray(x));
        }
    }

    // Map Interface
    
    function MapEntry(key, val) {
        this.$zera$key = key;
        this.$zera$val = val;
    }

    MapEntry.prototype.key = function() {
        return this.$zera$key;
    };

    MapEntry.prototype.val = function() {
        return this.$zera$val;
    };

    MapEntry.prototype.first = MapEntry.prototype.key;
    MapEntry.prototype.next  = MapEntry.prototype.val;

    MapEntry.prototype.rest = function() {
        return list(this.val());
    };

    MapEntry.prototype.toString = function() {
        return s('[', prnStr(this.key()), ' ', prnStr(this.val()), ']');
    };

    function mapEntry(x) {
        if (isMapEntry(x)) return x;
        else if (isArray(x) && x.length == 2) {
            return new MapEntry(x[0], x[1]);
        }
        else {
            throw new Error(s("Don't know how to coerce '", prnStr(x), "' into a zera.MapEntry"));
        }
    }
    
    function AMap(){}
    AMap.prototype = Object.create(Seq.prototype);

    function ArrayMap(array) {
        this.$zera$array = array ? array : [];
        this.$zera$valCache = {};
    }

    ArrayMap.prototype = Object.create(AMap.prototype);

    ArrayMap.EMPTY = new ArrayMap([]);

    ArrayMap.prototype.count = function() {
        return this.$zera$array.length / 2;
    };

    ArrayMap.prototype.toString = function() {
        var buff = [], i;
        var array = this.$zera$array;
        for (i = 0; i < array.length; i += 2) {
            buff.push(s(prnStr(array[i]), ' ', prnStr(array[i + 1])));
        }
        return s('{', buff.join(', '), '}');
    };

    ArrayMap.prototype.first = function() {
        return new MapEntry(this.$zera$array[0], this.$zera$array[1]);
    };

    ArrayMap.prototype.next = function() {
        return cdr(this.entries());
    };

    ArrayMap.prototype.rest = function() {
        var entries = this.entries();
        if (count(entries) === 0) return Cons.EMPTY;
        return cdr(this.entries());
    };

    ArrayMap.prototype.conj = function(entries) {
        var i, x, m = this;
        for (i = 0; i < entries.length; i++) {
            x = mapEntry(entries[i]);
        }
    };

    ArrayMap.prototype.entries = function() {
        var array = this.$zera$array;
        var i;
        var res = [];
        for (i = 0; i < array.length; i += 2) {
            res.push(new MapEntry(array[i], array[i + 1]));
        }
        return list.apply(null, res);
    };

    ArrayMap.prototype.keys = function() {
        var entries = this.$zera$array;
        var i;
        var res = [];
        for (i = 0; i < entries.length; i += 2) {
            res.push(entries[i]);
        }
        return list.apply(null, res);
    };

    ArrayMap.prototype.vals = function() {
        var entries = this.$zera$array;
        var i;
        var res = [];
        for (i = 0; i < entries.length; i += 2) {
            res.push(entries[i + 1]);
        }
        return list.apply(null, res);
    };

    ArrayMap.prototype.find = function(key) {
        /*if (this.$zera$valCache[key] != null) {
            return this.$zera$valCache[key];
        }*/
        var val, i, entries = this.$zera$array;
        for (i = 0; i < entries.length; i += 2) {
            if (equals(entries[i], key)) {
                val = entries[i + 1];
                //this.$zera$valCache[key] = val;
                return val;
            }
        }
    };

    ArrayMap.prototype.apply = function(x, args) {
        return this.find(args[0]);
    };

    ArrayMap.prototype.assoc = function(pairs) {
        var i;
        if (pairs.length % 2 !== 0) throw new Error('key value pairs must be even to assoc');
        var entries = Array.prototype.slice.call(this.$zera$array);
        for (i = 0; i < pairs.length; i += 2) {
            entries.push(pairs[i]);
            entries.push(pairs[i + 1]);
        }
        return new ArrayMap(entries);
    };

    ArrayMap.prototype.dissoc = function() {
    };

    function isMap(x) {
        return x instanceof AMap;
    }

    function isArrayMap(x) {
        return x instanceof ArrayMap;
    }

    function arrayMap() {
        return new ArrayMap(Array.prototype.slice.call(arguments));
    }

    function entries(m) {
        if (isJSFn(m.entries)) return m.entries();
        else {
            throw new Error(s("Don't know how to get the entries of: ", prnStr(m)));
        }
    }

    function find(m, key) {
        if (isJSFn(m.find)) {
            return m.find(key);
        }
        else {
            throw new Error(s("Don't know how to find value by key in: ", prnStr(m)));
        }
    }

    function get(m, key, alt) {
        if (isJSFn(m.find)) {
            var val = m.find(key);
            if (alt == null) {
                return val ? val : null;
            }
            else {
                return val ? val : alt;
            }
        }
        else {
            throw new Error(s("Don't know how to get value by key from: ", prnStr(m)));
        }
    }

    function assoc(m) {
        var pairs = Array.prototype.slice.call(arguments, 1);
        if (isJSFn(m.assoc)) {
            return m.assoc(pairs);
        }
        else {
            throw new Error(s("Don't know how to get from: ", prnStr(m)));
        }
    }

    function keys(m) {
        if (isJSFn(m.keys)) {
            return m.keys();
        }
        else {
            throw new Error(s("Don't know how to get keys from: ", prnStr(m)));
        }
    }

    function vals(m) {
        if (isJSFn(m.vals)) {
            return m.vals();
        }
        else {
            throw new Error(s("Don't know how to get vals from: ", prnStr(m)));
        }
    }

    function key(m) {
        if (isJSFn(m.key)) {
            return m.key();
        }
        else {
            throw new Error(s("Don't know how to get key from: ", prnStr(m)));
        }
    }

    function val(m) {
        if (isJSFn(m.val)) {
            return m.val();
        }
        else {
            throw new Error(s("Don't know how to get val from: ", prnStr(m)));
        }
    }

    // Collection interface
    
    function count(col) {
        // nil
        if (col == null) {
            return 0;
        }
        else if (isJSFn(col.count)) {
            return col.count();
        }
        // array-like
        else if (col.length != null) {
            return col.length;
        }
        else {
            throw new Error(s("Don't know how to get the count of: ", prnStr(col)));
        }
    }

    function conj(col) {
        var args = Array.prototype.slice.call(arguments, 1);
        var xs = col == null ? Cons.EMPTY : col;
        var i;
        if (isJSFn(xs.conj)) return xs.conj(args);
        else if (isArrayLike(xs)) {
            for (i = 0; i < args.length; i++) {
                xs.push(args[i]);
            }
            return xs;
        }
        else {
            throw new Error(s("Don't know how to conj: ", prnStr(xs)));
        }
    }

    function first(xs) {
        if (xs == null) return null;
        else if (isJSFn(xs.first)) return xs.first();
        else if (isArrayLike(xs)) {
            return xs[0];
        }
        else {
            throw new Error(s("Don't know how to get the first element of: ", prnStr(xs)));
        }
    }

    function next(xs) {
        if (xs == null) return null;
        else if (isJSFn(xs.next)) return xs.next();
        else if (isArrayLike(xs)) {
            if (xs.length === 0) return null;
            return Array.prototype.slice.call(xs, 1);
        }
        else {
            throw new Error(s("Don't know how to get the rest of the elements of: ", prnStr(xs)));
        }
    }

    function rest(xs) {
        if (xs == null) return null;
        else if (isJSFn(xs.rest)) return xs.rest();
        else if (isArrayLike(xs)) {
            return Array.prototype.slice.call(xs, 1);
        }
        else {
            throw new Error(s("Don't know how to get the rest of the elements of: ", prnStr(xs)));
        }
    }

    function isEmpty(x) {
        if (x == null) return true;
        else if (isJSFn(x.isEmpty)) return x.isEmpty();
        else if (isJSFn(x.count)) return x.count() === 0;
        else if (isArrayLike(x)) return x.length === 0;
        else {
            throw new Error(s("Don't know hot to determine if: ", prnStr(x), " is empty"));
        }
    }

    function reduce(f) {
        var x, init, xs;
        if (arguments.length === 1) {
            return function(init, xs) {
                return reduce(f, init, xs);
            };
        } else if (arguments.length === 2) {
            xs   = arguments[1];
            init = first(xs);
            xs   = rest(xs);
        } else if (arguments.length === 3) {
            xs   = arguments[1];
            init = arguments[2];
        } else {
            throw new Error(s('Expected between 1 and 3 arguments, got: ', arguments.length));
        }
        while (!isEmpty(xs)) {
            x    = first(xs);
            init = apply(f, list(init, x));
            xs   = rest(xs);
        }
        return init;
    }

    // TODO: look into transducers
    function map(f, xs) {
        if (arguments.length === 1) {
            return function(xs) {
                return map(f, xs);
            };
        }
        else if (arguments.length === 2) {
            return lazyList(function() {
                var xs_ = next(xs);
                if (xs_ === null) {
                    return null;
                }
                return cons(apply(f, list(first(xs))), map(f, xs_));
            });
        }
        else {
            throw new Error(s('Expected 1 or 2 arguments, got: ', arguments.length));
        }
    }

    // TODO: use LazyList
    function filter(f, xs) {
        if (arguments.length === 1) {
            return function(xs) {
                return filter(f, xs);
            };
        }
        else if (arguments.length === 2) {
            return reverse(reduce(function(ys, x) {
                var pred = apply(f, list(x));
                if (pred != null && pred !== false) {
                    return conj(ys, x);
                }
                return ys;
            }, xs, null));
        }
        else {
            throw new Error(s('Expected 1 or 2 arguments, got: ', arguments.length));
        }
    }

    function prnStr(x) {
        if (x == null) return "nil";
        else if (isNumber(x)) return s(x);
        else if (isBoolean(x)) {
            return x ? "true" : "false";
        } else if (isString(x)) {
            return s('"', x, '"');
        } else if (isEnv(x)) {
            return 'env';
        } else if (isCons(x)) {
            if (isPair(x)) {
                return s('(', prnStr(car(x)), " & ", prnStr(cdr(x)), ')');
            } else if (isEmpty(x)) {
                return '()';
            } else {
                var y = car(x);
                var ys = cdr(x);
                var buffer = [];
                while (y != null) { // FIXME: should be able to tolerate nil (i.e. null) values
                    buffer.push(prnStr(y));
                    y = car(ys);
                    ys = cdr(ys);
                }
                return s('(', buffer.join(' '), ')');
            }
        } else if (isArray(x)) {
            if (x.length === 0) {
                return '(array)';
            }
            return s('(array ', x.map(function(x) {
                return prnStr(x);
            }).join(' '), ')');
        } else {
            return "" + x;
        }
    }

    function prn(x) {
        console.log(prnStr(x));
    }

    function isBoolean(x) {
        return Object.prototype.toString.call(x) === '[object Boolean]';
    }

    // symbols can be quoted with ":", "'" or by surrounding in "'s
    function isString(x) {
        return Object.prototype.toString.call(x) === '[object String]';
    }

    var s = function() {
        return Array.prototype.slice.call(arguments).join('');
    };

    function num(x) {
        var type = Object.prototype.toString.call(x);
        if (type === '[object Number]') {
            return x;
        } else if (type === '[object String]') {
            var x_ = 1 * x;
            if (isNaN(x_)) throw new Error(s('Cannot convert: ', prnStr(x), ' to a number'));
            return x_;
        } else {
            throw new Error(s('Cannot convert: ', prnStr(x), ' to a number'));
        }
    }

    function arrayToCons(a) {
        if (a == null || a.length === 0) return Cons.EMPTY;
        else if (a.length === 1) return cons(a[0], Cons.EMPTY);
        var i;
        var list = null;
        for (i = a.length - 1; i >= 0; i--) {
            list = cons(a[i], list);
        }
        return list;
    }

    function isNumber(x) {
        return Object.prototype.toString.call(x) === '[object Number]';
    }

    function isAtom(x) {
        return isBoolean(x) || isNumber(x) || isString(x) || isKeyword(x) || x == null;
    }

    function equals(a, b) {
        if (a == null) {
            return b == null;
        }
        else if (isJSFn(a.equals)) {
            return a.equals(b);
        }
        else {
            return a === b;
        }
    }

    var p = console.log.bind();

    function is(expected, actual, msg) {
        if (expected === actual) {
            if (msg) {
                p(s('passed - ', msg));
            } else {
                p('passed');
            }
        } else {
            if (msg) {
                p(s('failed - ', msg));
            } else {
                p('failed');
            }
            p('expected: ', expected);
            p('got: ', actual);
        }
    }

    function ok(value, msg) {
        if (value != null && value !== false) {
            if (msg) {
                p(s('passed - ', msg));
            } else {
                p('passed');
            }
        } else {
            if (msg) {
                p(s('failed - ', msg));
            } else {
                p('failed');
            }
        }
    }

    function evalQuote(form) {
        return car(cdr(form));
    }

    // TODO: complete Var implementation
    function Var(namespace, name) {
        this.$zera$ns         = namespace;
        this.$zera$name       = name;
        this.$zera$isDyanamic = false;
        this.$zera$isMacro    = false;
        ARef.call(this);
    }

    Var.prototype = Object.create(ARef.prototype);

    Var.intern = function(ns, sym, init) {
        var ns_ = isNamespace(ns) ? ns : Namespace.findOrCreate(ns);
        var v = ns_.intern(sym);
        if (init) v.set(init);
        return v;
    };

    Var.prototype.get = function() {
        return this.$zera$value;
    };

    // TODO: add validation and watchers
    Var.prototype.set = function(value) {
        if (this.$zera$value == null || this.$zera$isDynamic) {
            this.$zera$value = value;
            return value;
        }
        else {
            throw new Error("Can't set Var value once it has been set");
        }
    };

    Var.prototype.setDynamic = function() {
        this.$zera$isDynamic = true;
        return this;
    };

    Var.prototype.isDynamic = function() {
        return !!this.$zera$isDynamic;
    };

    Var.prototype.setMacro = function() {
        this.$zera$isMacro = true;
        return this;
    };

    Var.prototype.isMacro = function() {
        return !!this.$zera$isMacro;
    };

    Var.prototype.toString = function() {
        return s("#'", this.$zera$ns.name(), '/', this.$zera$name);
    };

    function define(ns, name, init) {
        return Var.intern(ns, Sym.intern(name), init);
    }

    function isVar(x) {
        return x instanceof Var;
    }

    function varGet(v) {
        if (isVar(v)) return v.get();
        throw new Error('var-get can only be used on Vars');
    }

    function varSet(v, value) {
        if (isVar(v)) return v.set(value);
        throw new Error('var-set can only be used on Vars');
    }

    // TODO: complete Namespace implementation
    function Namespace(name) {
        if (!isSymbol(name)) throw new Error(s('Namespace name should be a symbol, got: ', prnStr(name)));
        this.$zera$name     = name;
        this.$zera$mappings = {};
        this.$zera$aliases  = {};
    }

    Namespace.namespaces = {};

    Namespace.all = function() {
        return list.apply(null, Object.values(Namespace.namespaces));
    };

    Namespace.findOrCreate = function(name) {
        var ns = Namespace.namespaces[name];
        if (ns != null) return ns;
        else {
            ns = new Namespace(name);
            Namespace.namespaces[name] = ns;
        }
        return ns;
    };

    Namespace.findOrDie = function(name) {
        var ns = Namespace.namespaces[name];
        if (ns != null) return ns;
        else {
            throw new Error(s("Can't find the namespace: ", name));
        }
    };

    Namespace.prototype.name = function() {
        return this.$zera$name;
    };

    Namespace.prototype.mappings = function() {
        return this.$zera$mappings;
    };

    Namespace.prototype.mapping = function(sym) {
        return this.$zera$mappings[sym];
    };

    Namespace.prototype.intern = function(sym) {
        if (!isSymbol(sym)) throw new Error('Namespace can only intern symbols');
        if (sym.namespace() != null) throw new Error('Cannot intern namespace-qualified symbol');
        var v = new Var(this, sym);
        this.$zera$mappings[sym] = v;
        return v;
    };

    Namespace.prototype.toString = function() {
        return s('#<Namespace name: ', this.$zera$name, '>');
    };

    function theNS(ns) {
        if (isNamespace(ns)) return ns;
        return Namespace.findOrDie(ns);
    }

    function nsName(ns) {
        var ns_ = theNS(ns);
        return ns_.name();
    }

    function isNamespace(x) {
        return x instanceof Namespace;
    }

    function createNS(sym) {
        return new Namespace(sym);
    }

    function findNS(sym) {
        return Namespace.namespaces[sym];
    }

    function nsMap(sym) {
        var ns = theNS(sym);
        return objectToMap(ns.mappings());
    }

    var ZERA_NS    = Namespace.findOrCreate(Sym.intern('zera.core'));
    var CURRENT_NS = Var.intern(ZERA_NS, Sym.intern('*ns*'), ZERA_NS).setDynamic();

    function env(parent) {
        if (parent) {
            return {
                vars: {},
                parent: parent
            };
        } else {
            return {
                vars: {},
                parent: null
            };
        }
    }

    function isEnv(x) {
        return x != null && x.vars !== void(0);
    }

    function lookup(env, name) {
        if (env == null) {
            return null;
        } else if (env.vars != null && env.vars[name] != null) {
            return env;
        } else {
            if (env.parent == null) {
                return null;
            } else {
                var scope = env.parent;
                while (scope != null) {
                    if (scope.vars != null && scope.vars[name] != null) {
                        return scope;
                    }
                    scope = scope.parent;
                }
                return null;
            }
        }
    }

    function defineLexically(env, name, value) {
        if (typeof value !== 'undefined') {
            env.vars[name] = value;
            return null;
        } else {
            env.vars[name] = null;
            return null;
        }
    }

    function findVar(sym) {
        var ERROR_UNDEFINED_VAR = new Error(s('Undefined variable: ', sym));
        var ns, v, scope, name = sym.name();
        if (sym.isNamespaceQualified()) {
            ns = Namespace.findOrDie(sym.namespace());
            v  = ns.mapping(name);
            if (!v) throw ERROR_UNDEFINED_VAR;
            return v;
        }
        else {
            v = CURRENT_NS.get().mapping(name);
            if (v) return v;
            else {
                v = ZERA_NS.mapping(name);
                if (v) return v;
                throw ERROR_UNDEFINED_VAR;
            }
        }

    }

    // TODO: should lexically scoped values be wrapped in Vars?
    // 1) if namespace-qualified lookup in namespace
    // 2) lookup in lexical scope
    // 3) lookup in current namespace
    // 4) lookup in default namespace
    // (could go back and put default imports in top then they'll always befound lexically unless they've been redefined and should be more performant)
    function evalSymbol(sym, env) {
        var ERROR_UNDEFINED_VAR = new Error(s('Undefined variable: ', sym));
        var MACRO_ERROR = new Error(s('Macros cannot be evaluated in this context'))
        var ns, v, scope, name = sym.name();
        // 1) namespace-qualified
        if (sym.isNamespaceQualified()) {
            ns = Namespace.findOrDie(sym.namespace());
            v  = ns.mapping(name);
            if (!v) throw ERROR_UNDEFINED_VAR;
            if (v.isMacro()) throw MACRO_ERROR;
            return v.get();
        }
        else {
            // 2) lookup in lexical environment
            scope = lookup(env, name);
            if (scope != null) {
                return scope.vars[name];
            }
            else {
                // 3) lookup in curret namespace
                v = CURRENT_NS.get().mapping(name);
                if (v) {
                    if (v.isMacro()) throw MACRO_ERROR;
                    return v.get();
                }
                else {
                    // 4) lookup in default namespace
                    v = ZERA_NS.mapping(name);
                    if (v) {
                        if (v.isMacro()) throw MACRO_ERROR;
                        return v.get();
                    }
                    throw ERROR_UNDEFINED_VAR;
                }
            }
        }
    }

    function set(env, name, value) {
        if (!name.isNamespaceQualified()) {
            var scope = lookup(env, name);
            if (scope) return scope.vars[name];
        }
        var v = findVar(name);
        return v.set(value);
    }

    // TODO: add let body, etc.
    function evalLexicalDefinition(form, env) {
        var rest = cdr(form);
        var name = car(rest);
        var value = car(cdr(rest));
        defineLexically(env, name);
        return defineLexically(env, name, evaluate(value, env));
    }

    function evalDefinition(form, env) {
        var rest = cdr(form);
        var name = car(rest);
        var value = car(cdr(rest));
        var ns = CURRENT_NS.get();
        var v = Var.intern(ns, name, evaluate(value, env));
        if (name.meta()) v.resetMeta(name.meta());
        return v;
    }

    function evalAssignment(form, env) {
        var rest = cdr(form);
        var name = car(rest);
        var value = car(cdr(rest));
        return set(env, name, evaluate(value, env));
    }

    function reverse(xs) {
        if (isEmpty(xs)) {
            return Cons.EMPTY;
        } else {
            var xs_ = cdr(xs),
                x = car(xs),
                l = Cons.EMPTY;
            while (x) {
                l = cons(x, l);
                x = car(xs_);
                xs_ = cdr(xs_);
            }
            return l;
        }
    }

    function pair(xs) {
        if (isNil(xs)) {
            return Cons.EMPTY;
        } else if (count(xs) == 1) {
            return xs;
        } else {
            var xs_ = xs,
                x = car(xs_),
                y = car(cdr(xs_)),
                l = Cons.EMPTY;
            while (x && y) {
                l = cons(cons(x, y), l);
                xs_ = cdr(cdr(xs_));
                x = car(xs_);
                y = car(cdr(xs_));
            }
            return l;
        }
    }

    function objectToPairs(obj) {
        var keys = obj.getOwnPropertyNames();
        var l = Nil,
            i;
        for (i = 0; i < keys.length; i++) {
            l = cons(cons(keys[i], obj[keys[i]]), l);
        }
        return l;
    }

    function objectToMap(obj) {
        if (obj == null) return ArrayMap.EMPTY;
        var keys = Object.getOwnPropertyNames(obj);
        if (keys.length === 0) return null;
        var i, entries = [];
        for (i = 0; i < keys.length; i++) {
            entries.push(Sym.intern(keys[i]));
            entries.push(obj[keys[i]]);
        }
        return new ArrayMap(entries);
    }

    function evalConditional(form, env) {
        var preds = cdr(form);
        if (count(preds) % 2 !== 0) {
            throw new Error(s('cond requires an even number of predicates: ', prnStr(form)));
        }
        var i = 1,
            x, y, rest, xs = preds;
        while (i < count(preds)) {
            rest = cdr(xs);
            x = car(xs);
            y = car(rest);
            if (x === 'else') {
                return evaluate(y, env);
            } else {
                x = evaluate(x, env);
                if (!isNil(x) && x !== false) {
                    return evaluate(y, env);
                }
            }
            xs = cdr(rest);
            i++;
        }
        return null;
    }

    function isFn(x) {
        if (isPair(x)) {
            var tag = first(first(x));
            return tag != null && tag.toString() === 'fn';
        }
        return false;
    }

    function isJSFn(x) {
        return Object.prototype.toString.call(x) === '[object Function]';
    }

    function isInvocable(x) {
        return isJSFn(x.apply);
    }

    function consToArray(cons) {
        var x = car(cons);
        var xs = cdr(cons);
        var a = [];
        while (x != null) {
            a.push(x);
            x = car(xs);
            xs = cdr(xs);
        }
        return a;
    }

    function bindArguments(names, values) {
        if (isPair(names)) {
            if (isEmpty(car(names))) {
                return [
                    [cdr(names), values]
                ];
            } else {
                return [
                    [car(names), car(values)],
                    [cdr(names), cdr(values)]
                ];
            }
        } else {
            var i, binds = [];
            var names_ = consToArray(names);
            var values_ = consToArray(values);
            for (i = 0; i < names_.length; i++) {
                if (isPair(names_[i])) {
                    binds.push([car(names_[i]), values_[i]]);
                    binds.push([cdr(names_[i]), arrayToCons(values_.slice(i + 1))]);
                } else {
                    binds.push([names_[i], values_[i]]);
                }
            }
            return binds;
        }
    }

    function calculateArity(args) {
        if (isPair(args)) {
            if (isEmpty(car(args))) return -1;
            else {
                return -2;
            }
        }
        var args_ = consToArray(args);
        var argc = args_.length;
        var i;
        for (i = 0; i < argc; i++) {
            if (isPair(args_[i])) {
                return -1 * argc;
            }
        }
        return argc;
    }

    /*
    prn(bindArguments(list('x'), list(1)));
    prn(bindArguments(list('x', 'y'), list(1, 2)));
    prn(bindArguments(cons('x', 'xs'), list(1, 2)));
    prn(bindArguments(list('x', cons('y', 'ys')), list(1, 2, 3, 4, 5)));
    */

    // add capture variables using pair notation
    function apply(x, args) {
        if (isInvocable(x)) {
            return x.apply(null, consToArray(args));
        }
        if (!isFn(x)) {
            throw new Error(s('Not a valid function: ', prnStr(x), ''));
        }
        var fn = car(x);
        var env = cdr(x);
        var rest = cdr(fn);
        var names = car(rest);
        var body = cdr(rest);

        if (isEmpty(body)) return null;

        var namec = calculateArity(names);
        var argc = count(args);
        if (namec < 0 && argc < (Math.abs(namec) - 1)) {
            throw new Error(s('Wrong number of arguments, expected at least: ', Math.abs(namec) - 1, ', got: ', argc));
        } else if (namec > 0 && namec !== argc) {
            throw new Error(s('Wrong number of arguments, expected: ', namec, ', got: ', argc));
        }

        // bind arguments
        var binds = bindArguments(names, args);
        for (var i = 0; i < binds.length; i++) {
            var name = binds[i][0];
            var value = binds[i][1];
            defineLexically(env, name, value);
        }

        // evaluate body
        var ret = null,
            exp = car(body),
            exprs = cdr(body);
        while (exp != null) {
            ret = evaluate(exp, env);
            exp = car(exprs);
            exprs = cdr(exprs);
        }
        return ret;
    }

    function pt(tag, val) {
        p(s(tag, ': ', prnStr(val)));
    }

    function evalApplication(form, env) {
        var fn = evaluate(car(form), env);
        var args = cdr(form);
        var a = car(args);
        var as = cdr(args);
        var args_ = list.apply(null, mapA(function(x) { return evaluate(x, env); }, args));
        return apply(fn, args_);
    }

    function evalFunction(form, env_) {
        //prn(form);
        var rest = cdr(form),
            names = car(rest),
            body = cdr(rest);
        //p(names);
        if (!isCons(names)) throw new Error('function arguments should be a list');
        // TODO: add variable validation, capture variable values from environment
        // TODO: add recur support
        return cons(form, env(env_));
    }

    function evalMacroDefinition(form, env) {
        var rest = cdr(form),
            name = car(rest),
            fnrest = cdr(rest);
        var val = evalFunction(cons(FN_SYM, fnrest), env);
        return Var.intern(CURRENT_NS.get(), name, val).setMacro();
    }

    function isTaggedValue(x) {
        return isCons(x) && isSymbol(car(x));
    }

    function macroexpand(form) {
        if (isTaggedValue(form)) {
            var sym  = car(form);
            var name = sym.toString();
            if (SPECIAL_FORMS[name]) {
                return form;
            } else if (name != '.-' && name.startsWith('.-')) {
                return list('.', car(cdr(form)), name.slice(1));
            } else if (name != '.' && name.startsWith('.')) {
                return list('.', car(cdr(form)), cons(name.slice(1), cdr(cdr(form))));
            } else if (name.endsWith('.')) {
                return cons('new', cons(name.replace(/\.$/, ''), cdr(form)));
            } else {
                var v = findVar(sym);
                if (v.isMacro()) {
                    return macroexpand(apply(v.get(), cdr(form)));
                }
                else {
                    return form;
                }
            }
        }
        return form;
    }

    function RecursionPoint(args) {
        this.args = args;
    }

    function evalRecursionPoint(form, env) {
        var args = mapA(function(x) {
            return evaluate(x, env);
        }, cdr(form));
        throw new RecursionPoint(args);
    }

    function evalLoop(form, env_) {
        var binds = car(cdr(form));
        var body = cdr(cdr(form));
        var scope = env(env_);
        var ret = null;

        if (count(binds) % 2 !== 0) {
            throw new Error('loop requires an even number of bindings');
        }

        // bind variables & collect names
        var i;
        var binds_ = consToArray(binds);
        var names = [],
            name, value, evaled;
        for (i = 0; i < binds_.length; i += 2) {
            name = binds_[i];
            value = binds_[i + 1];
            names.push(name);
            defineLexically(scope, name);
            evaled = evaluate(value, scope);
            defineLexically(scope, name, evaled);
        }

        loop:
            while (true) {
                try {
                    // evaluate body
                    var exp = car(body),
                        exprs = cdr(body);
                    while (exp != null) {
                        ret = evaluate(exp, scope);
                        exp = car(exprs);
                        exprs = cdr(exprs);
                    }
                    break;
                } catch (e) {
                    //p(e.args);
                    if (e instanceof RecursionPoint) {
                        if (names.length !== e.args.length) {
                            throw new Error(s('Wrong number or arguments, expected: ', names.length, ' got: ', e.args.length));
                        }
                        for (i = 0; i < names.length; i++) {
                            define(scope, names[i], e.args[i]);
                        }
                        continue loop;
                    } else {
                        throw e;
                    }
                }
            }
        return ret;
    }

    function evalClassInstantiation(form, env) {
        var ctr = evaluate(car(cdr(form)), env);
        if (!isJSFn(ctr)) throw new Error('class given is not a valid constructor');
        var args = mapA(function(x) {
            return evaluate(x, env);
        }, cdr(cdr(form)));
        return new(ctr.bind.apply(ctr, [].concat(ctr, args)));
    }

    // member access
    // (. obj member)
    // (. obj symbol)
    // (. obj -symbol)
    // (. obj (symbol *args))
    // (. obj (-symbol))
    function evalMemberAccess(form, env) {
        var obj = evaluate(car(cdr(form)), env);
        var member = car(cdr(cdr(form)));
        var val;
        if (isSymbol(member)) {
            val = obj[member];
            if (member.startsWith('-')) {
                return obj[member.slice(1)];
            } else if (isJSFn(val)) {
                return val.call(obj);
            } else {
                return val;
            }
        } else if (isCons(member)) {
            var name = car(member);
            val = obj[name];
            if (name.startsWith('-')) {
                return obj[name.slice(1)];
            } else if (isJSFn(val)) {
                var args = mapA(function(x) {
                    return evaluate(x, env);
                }, cdr(member));
                return val.apply(obj, args);
            } else {
                throw new Error(s('invalid member access: "', prnStr(form), '"'));
            }
        } else {
            throw new Error(s('invalid member access: "', prnStr(form), '"'));
        }
    }

    function evalThrownException(form, env) {
        var exp = evaluate(cdr(form), env);
        throw exp;
    }

    function evalVar(form, env) {
        var exp = car(cdr(form));
        if (!isSymbol(exp)) throw new Error('Var name should be a Symbol, got: ' + prnStr(exp));
        return Var.intern(Sym.intern(exp.namespace()), Sym.intern(exp.name()));
    }

    var top = env();

    // TODO: add catch / finally
    // TODO: add deftype / defprotocol
    function evaluate(form_, env_) {
        var env = env_ || top;
        var recur = true;
        var ret = null;
        var form = macroexpand(form_);
        while (recur) {
            recur = false;
            if (form == null || NIL_SYM.equals(form)) {
                ret = null;
            } else if (isAtom(form) || isJSFn(form) || isMap(form)) {
                ret = form;
            } else if (isSymbol(form)) {
                ret = evalSymbol(form, env);
            } else if (isCons(form)) {
                if (form.isEmpty()) return form;
                var tag = s(car(form));
                switch (tag) {
                    case 'quote':
                        ret = evalQuote(form);
                        break;
                    case 'def':
                        ret = evalDefinition(form, env);
                        break;
                    case 'var':
                        ret = evalVar(form, env);
                        break;
                    case 'set!':
                        ret = evalAssignment(form, env);
                        break;
                    case 'cond':
                        ret = evalConditional(form, env);
                        break;
                    case 'fn':
                        ret = evalFunction(form, env);
                        break;
                    case 'loop':
                        ret = evalLoop(form, env);
                        break;
                    case 'recur':
                        ret = evalRecursionPoint(form, env);
                        break;
                    case 'throw':
                        ret = evalThrownException(form, env);
                        break;
                    case 'new':
                        ret = evalClassInstantiation(form, env);
                        break;
                    case '.':
                        ret = evalMemberAccess(form, env);
                        break;
                    case 'defmacro':
                        ret = evalMacroDefinition(form, env);
                        break;
                    default:
                        ret = evalApplication(form, env);
                        break;
                }
            } else {
                throw new Error(s('invalid form: "', form, '"'));
            }
        }
        return ret;
    }

    function isRegExp(x) {
        return Object.prototype.toString.call(x) === '[object RegExp]';
    }

    function isDate(x) {
        return Object.prototype.toString.call(x) === '[object Date]';
    }

    function isObject(x) {
        return Object.prototype.toString.call(x) === '[object Object]';
    }

    function isEven(x) {
        return x % 2 === 0;
    }

    function isOdd(x) {
        return x % 2 === 1;
    }

    function dropLast(l) {
        return reverse(cdr(reverse(l)));
    }

    function mapA(f, l) {
        if (isEmpty(l)) {
            return null;
        } else {
            var a = isArray(l) ? a : consToArray(l);
            var newA = [];
            var i;
            for (i = 0; i < a.length; i++) {
                newA.push(apply(f, list(a[i])));
            }
            return newA;
        }
    }

    function readJS(exp) {
        var i;
        if (isString(exp)) {
            if (exp.startsWith(':')) {
                return Keyword.intern(exp.substring(1));
            } else if (exp.startsWith("'")) {
                return list(QUOTE_SYM, Sym.intern(exp.substring(1)));
            } else if (exp.startsWith('"') && exp.endsWith('"')) {
                return exp.substring(1).substring(0, exp.length - 2);
            } else {
                return Sym.intern(exp);
            }
        } else if (isArray(exp)) {
            if (exp.length === 0) return Cons.EMPTY;
            if (exp.length === 1) return cons(readJS(exp[0]), Cons.EMPTY);
            var xs = null;
            var last = null, x;
            for (i = exp.length - 1; i >= 0; i--) {
                // use & to read pairs
                if (exp[i] === '&') {
                    if (exp.length === 2) return cons(Cons.EMPTY, readJS(last));
                    i--;
                    x = cons(readJS(exp[i]), last);
                    if (exp.length === 3) return x;
                    xs = dropLast(xs);
                } else {
                    x = readJS(exp[i]);
                }
                xs = cons(x, xs);
                last = x;
            }
            return xs;
        } else if (isJSFn(exp)) return exp;
        else if (isObject(exp)) {
            var keys = Object.getOwnPropertyNames(exp);
            if (keys.length === 0) return ArrayMap.EMPTY;
            var entries = [];
            for (i = 0; i < keys.length; i++) {
                entries.push(Sym.intern(keys[i]));
                entries.push(readJS(exp[keys[i]]));
            }
            return new ArrayMap(entries);
        } else {
            return exp;
        }
    }

    function readJSON(exp) {
        return readJS(JSON.parse(exp));
    }

    function evalJS(exp) {
        return evaluate(readJS(exp));
    }

    function evalJSON(json) {
        return evaluate(readJSON(json));
    }

    // primitive functions
    define(ZERA_NS, "var?", isVar);
    define(ZERA_NS, "var-get", varGet);
    define(ZERA_NS, "var-set", varSet);
    define(ZERA_NS, "the-ns", theNS);
    define(ZERA_NS, "ns-name", nsName);
    define(ZERA_NS, "create-ns", createNS);
    define(ZERA_NS, "find-ns", findNS);
    define(ZERA_NS, "ns-map", nsMap);
    define(ZERA_NS, "namespace?", isNamespace);
    define(ZERA_NS, "eval", evaluate);
    define(ZERA_NS, "apply", apply);
    define(ZERA_NS, "macroexpand", macroexpand);
    define(ZERA_NS, "nil?", isNil);
    define(ZERA_NS, "empty?", isEmpty);
    define(ZERA_NS, "list", list);
    define(ZERA_NS, "array-map", arrayMap);
    define(ZERA_NS, "array-map?", isArrayMap);
    define(ZERA_NS, "map?", isMap);
    define(ZERA_NS, "entries", entries);
    define(ZERA_NS, "get", get);
    define(ZERA_NS, "assoc", assoc);
    define(ZERA_NS, "keys", keys);
    define(ZERA_NS, "vals", vals);
    define(ZERA_NS, "key", key);
    define(ZERA_NS, "val", val);
    define(ZERA_NS, "list?", isList);
    define(ZERA_NS, "seq?", isSeq);
    define(ZERA_NS, "seqable?", isSeqable);
    define(ZERA_NS, "cons", cons);
    define(ZERA_NS, "count", count);
    define(ZERA_NS, "car", car);
    define(ZERA_NS, "cdr", cdr);
    define(ZERA_NS, "map", map);
    define(ZERA_NS, "reduce", reduce);
    define(ZERA_NS, "filter", filter);
    define(ZERA_NS, "take", take);
    define(ZERA_NS, "range", range);
    define(ZERA_NS, "first", first);
    define(ZERA_NS, "rest", rest);
    define(ZERA_NS, "next", next);
    define(ZERA_NS, "conj", conj);
    define(ZERA_NS, "cons?", isCons);
    define(ZERA_NS, "pair?", isPair);
    define(ZERA_NS, "pair", pair);
    define(ZERA_NS, "prn-str", prnStr);
    define(ZERA_NS, "prn", prn);
    define(ZERA_NS, "p", p);
    define(ZERA_NS, "str", s);
    define(ZERA_NS, "boolean?", isBoolean);
    define(ZERA_NS, "string?", isString);
    define(ZERA_NS, "symbol?", isSymbol);
    define(ZERA_NS, "symbol", symbol);
    define(ZERA_NS, "keyword", keyword);
    define(ZERA_NS, "keyword?", isKeyword);
    define(ZERA_NS, "name", name);
    define(ZERA_NS, "namespace", namespace);
    define(ZERA_NS, "number?", isNumber);
    define(ZERA_NS, "even?", isEven);
    define(ZERA_NS, "odd?", isOdd);
    define(ZERA_NS, "num", num);
    define(ZERA_NS, "is", is);
    define(ZERA_NS, "ok", ok);
    define(ZERA_NS, "cons->array", consToArray);
    define(ZERA_NS, "array->cons", arrayToCons);
    define(ZERA_NS, "array?", isArray);
    define(ZERA_NS, 'areduce', areduce);
    define(ZERA_NS, 'amap', amap);
    define(ZERA_NS, 'afilter', afilter);
    define(ZERA_NS, 'aset', aset);
    define(ZERA_NS, 'aget', aget);
    define(ZERA_NS, 'alength', alength);
    define(ZERA_NS, 'int-array', intArray);
    define(ZERA_NS, 'float-array', floatArray);
    define(ZERA_NS, "array", function() {
        return Array.prototype.slice.call(arguments);
    });
    define(ZERA_NS, "object->map", objectToMap);
    define(ZERA_NS, "object?", isObject);
    define(ZERA_NS, "read-js", readJS);
    define(ZERA_NS, "read-json", readJSON);

    define(ZERA_NS, "identical?", function(a, b) {
        return a === b;
    });
    define(ZERA_NS, "equiv?", function(a, b) {
        return a == b;
    });

    define(ZERA_NS, "=", equals);

    define(ZERA_NS, "assert", function(x) {
        if (x == null || x === false) throw new Error(s('Assert failed: ', prnStr(x)));
        return null;
    });

    define(ZERA_NS, "not", function(x) {
        return !x;
    });

    // bit operations
    define(ZERA_NS, "bit-not", function(x) {
        return ~x;
    });
    define(ZERA_NS, "bit-and", function(a, b) {
        return a & b;
    });
    define(ZERA_NS, "bit-or", function(a, b) {
        return a || b;
    });
    define(ZERA_NS, "bit-shift-left", function(a, b) {
        return a << b;
    });
    define(ZERA_NS, "bit-shift-right", function(a, b) {
        return a >> b;
    });
    define(ZERA_NS, "unsigned-bit-shift-right", function(a, b) {
        return a >>> b;
    });

    // TODO: rewrite these to match the Clojure API
    var lt = function(a, b) {
        if (arguments.length === 0) {
            return lt;
        } else if (arguments.length === 1) {
            return function(b) {
                return a < b;
            };
        } else {
            return a < b;
        }
    };
    define(ZERA_NS, '<', lt);

    var lteq = function(a, b) {
        if (arguments.length === 0) {
            return lteq;
        } else if (arguments.length === 1) {
            return function(b) {
                return a <= b;
            };
        } else {
            return a <= b;
        }
    };
    define(ZERA_NS, '<=', lteq);

    var gt = function(a, b) {
        if (arguments.length === 0) {
            return gt;
        } else if (arguments.length === 1) {
            return function(b) {
                return a > b;
            };
        } else {
            return a > b;
        }
    };
    define(ZERA_NS, '>', gt);

    var gteq = function(a, b) {
        if (arguments.length === 0) {
            return gteq;
        } else if (arguments.length === 1) {
            return function(b) {
                return a >= b;
            };
        } else {
            return a >= b;
        }
    };
    define(ZERA_NS, '>=', gteq);

    var add = function() {
        if (arguments.length === 0) {
            return add;
        } else if (arguments.length === 1) {
            var x = num(arguments[0]);
            return function() {
                return add.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
            };
        } else {
            var sum = 0;
            var i;
            for (i = 0; i < arguments.length; i++) {
                sum += num(arguments[i]);
            }
            return sum;
        }
    };
    define(ZERA_NS, "+", add);

    var sub = function() {
        if (arguments.length === 0) {
            return sub;
        } else if (arguments.length === 1) {
            var x = -num(arguments[0]);
            return function() {
                return sub.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
            };
        } else {
            var sum = 0;
            var i;
            for (i = 0; i < arguments.length; i++) {
                sum -= num(arguments[i]);
            }
            return sum;
        }
    };
    define(ZERA_NS, '-', sub);

    var mult = function() {
        if (arguments.length === 0) {
            return mult;
        } else if (arguments.length === 1) {
            var x = num(arguments[0]);
            return function() {
                return mult.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
            };
        } else {
            var sum = 1;
            var i;
            for (i = 0; i < arguments.length; i++) {
                sum *= num(arguments[i]);
            }
            return sum;
        }
    };
    define(ZERA_NS, '*', mult);

    var div = function() {
        if (arguments.length === 0) {
            return div;
        } else if (arguments.length === 1) {
            var x = num(arguments[0]);
            return function() {
                return div.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
            };
        } else {
            var sum = 1;
            var i;
            for (i = 0; i < arguments.length; i++) {
                sum /= num(arguments[i]);
            }
            return sum;
        }
    };
    define(ZERA_NS, '/', div);

    function symbolImporter(ns) {
        return function(name) {
            try {
                var val = eval(name);
                if (val != null) {
                    define(ns, name, val);
                }
            } catch (e) {
                //console.error(e);
            }
        };
    }

    define(ZERA_NS, '*platform*', Sym.intern('js'));

    var JS_NS = Namespace.findOrCreate(Sym.intern('js'));

    // import js stuff
    [
        'Array',
        'ArrayBuffer',
        'AsyncFunction',
        'Atomics',
        'Boolean',
        'DataView',
        'Date',
        'Error',
        'EvalError',
        'Float32Array',
        'Float64Array',
        'Function',
        'Generator',
        'GeneratorFunction',
        'Infinity',
        'Int32Array',
        'Int64Array',
        'Int8Array',
        'InternalError',
        'Intl',
        'JSON',
        'Map',
        'Math',
        'NaN',
        'Number',
        'Object',
        'Promise',
        'Proxy',
        'RangeError',
        'ReferenceError',
        'Reflect',
        'RegExp',
        'Set',
        'String',
        'Symbol',
        'SyntaxError',
        'TypeError',
        'TypedArray',
        'URIError',
        'Uint16Array',
        'Uint32Array',
        'Uint8Array',
        'Uint8ClampedArray',
        'WeakMap',
        'WeakSet',
        'decodeURI',
        'decodeURIComponent',
        'encodeURI',
        'encodeURIComponent',
        'eval',
        'isFinite',
        'isNaN',
        'parseFloat',
        'parseInt',
        'uneval',
        'SIMD',
        'WebAssembly',
        'window',
        'document',
        'location',
        'localStorage',
        'console',
        'setInterval',
        'setTimeout',
        'clearInterval',
        'clearTimeout'
    ].forEach(symbolImporter(JS_NS));

    if (isBrowser) {
        var DOM_NS = Namespace.findOrCreate(Sym.intern('js.dom'));
        define(ZERA_NS, '*platform*', Sym.intern('js/browser'));
        [
            'Attr',
            'ByteString',
            'CDATASection',
            'CharacterData',
            'ChildNode',
            'CSSPrimitiveValue',
            'CSSValue',
            'CSSValueList',
            'Comment',
            'CustomEvent',
            'Document',
            'DocumentFragment',
            'DocumentType',
            'DOMError',
            'DOMException',
            'DOMImplmentation',
            'DOMString',
            'DOMTimeStamp',
            'DOMStringList',
            'DOMTokenList',
            'Element',
            'Event',
            'EventTarget',
            'MutationObserver',
            'MutationRecord',
            'Node',
            'NodeFilter',
            'NodeIterator',
            'NodeList',
            'ParentNode',
            'ProcessingInstruction',
            'Range',
            'Text',
            'TreeWalker',
            'URL',
            'Window',
            'Worker',
            'XMLDocument',
            'HTMLAnchorElement',
            'HTMLAreaElement',
            'HTMLAudioElement',
            'HTMLBaseElement',
            'HTMLBodyElement',
            'HTMLBREElement',
            'HTMLButtonElement',
            'HTMLCanvasElement',
            'HTMLDataElement',
            'HTMLDataListElement',
            'HTMLDialogElement',
            'HTMLDivElement',
            'HTMLDListElement',
            'HTMLEmbedElement',
            'HTMLFieldSetElement',
            'HTMLFontElement',
            'HTMLFormElement',
            'HTMLFrameSetElement',
            'HTMLHeadElement',
            'HTMLHtmlElement',
            'HTMLHRElement',
            'HTMLIFrameElement',
            'HTMLImageElement',
            'HTMLInputElement',
            'HTMLKeygenElement',
            'HTMLLabelElement',
            'HTMLLIElement',
            'HTMLLinkElement',
            'HTMLMapElement',
            'HTMLMediaElement',
            'HTMLMetaElement',
            'HTMLMeterElement',
            'HTMLModElement',
            'HTMLObjectElement',
            'HTMLOListElement',
            'HTMLOptGroupElement',
            'HTMLOptionElement',
            'HTMLOutputElement',
            'HTMLParagraphElement',
            'HTMLParamElement',
            'HTMLPreElement',
            'HTMLProgressElement',
            'HTMLQuoteElement',
            'HTMLScriptElement',
            'HTMLSelectElement',
            'HTMLSourceElement',
            'HTMLSpanElement',
            'HTMLStyleElement',
            'HTMLTableElement',
            'HTMLTableCaptionElement',
            'HTMLTableCellElement',
            'HTMLTableDataCellElement',
            'HTMLTableHeaderCellElement',
            'HTMLTableColElement',
            'HTMLTableRowElement',
            'HTMLTableSectionElement',
            'HTMLTextAreaElement',
            'HTMLTimeElement',
            'HTMLTitleElement',
            'HTMLTrackElement',
            'HTMLUListElement',
            'HTMLUnknownElement',
            'HTMLVideoElement',
            'CanvasRenderingContext2D',
            'CanvasGradient',
            'CanvasPattern',
            'TextMetrics',
            'ImageData',
            'CanvasPixelArray',
            'NotifyAudioAvailableEvent',
            'HTMLFormControlsCollection',
            'HTMLOptionsCollection',
            'DOMStringMap',
            'RadioNodeList',
            'MediaError'
        ].forEach(symbolImporter(DOM_NS));
    }

    if (isNode) {
        var NODE_NS = Namespace.findOrCreate(Sym.intern('js.node'));
        define(ZERA_NS, '*platform*', Sym.intern("js/node"));
        [
            'Buffer',
            '__dirname',
            '__filename',
            'clearImmediate',
            'console',
            'exports',
            'global',
            'process',
            'setImmediate',
        ].forEach(symbolImporter(NODE_NS));
    }

    //
    // Reader
    // 

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
        return list.apply(null, a);
    }

    function unmatchedDelimiterReader(r, delim, opts) {
        throw new Error('Unmatched delimiter: ' + delim);
    }

    function vectorReader(r, openbracket, opts) {
        return readDelimitedList(']', r, true, opts);
    }

    function mapReader(r, openbracket, opts) {
        var a = readDelimitedList('}', r, true, opts);
        return arrayMap.apply(null, a);
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

    var TAG_KEY    = Keyword.intern('tag');
    var LINE_KEY   = Keyword.intern('line');
    var COLUMN_KEY = Keyword.intern('colunm');

    function metaReader(r, hat, opts) {
        var line = r.line();
        var column = r.column();
        var meta = read(r, true, null, true, opts);
        // FIXME: we probably don't have any use for tags
        if (isSymbol(meta) || isString(meta)) {
            meta = arrayMap(TAG_KEY, meta);
        }
        else if (isKeyword(meta)) {
            meta = arrayMap(meta, true);
        }
        else if (!isMap(meta)) {
            throw new Error('Metadata must be a Symbol, Keyword, String or Map');
        }
        
        var x = read(r, true, null, true, opts);
        if (x instanceof IMeta) {
            if (isSeq(x)) {
                meta = meta.assoc([LINE_KEY, line, COLUMN_KEY, column]);
            }
            if (x instanceof AReference) {
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

    function wrappingReader(sym) {
        return function(r, quote, opts) {
            var x = read(r, true, null, true, opts);
            return list(sym, x);
        };
    }

    var THE_VAR = Sym.intern('var');

    function varReader(r, quote, opts) {
        var x = read(r, true, null, true, opts);
        return list(THE_VAR, x);
    }

    var MACROS = {
        '"': stringReader,
        ';': commentReader,
        "'": wrappingReader(Sym.intern('quote')),
        '@': wrappingReader(Sym.intern('deref')),
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
        '^': metaReader,
        "'": varReader
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
            return Keyword.intern(Sym.intern(s.substring(1)));
        }
        return Sym.intern(s);
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

    function evalString(s) {
        return evaluate(readString(s));
    }

    evalJS(
        ['defmacro', 'defn', ['name', 'args', '&', 'body'],
            ['list', "'def", 'name', ['cons', "'fn", ['cons', 'args', 'body']]]]);

    evalJS(
        ['defn', 'compile', ['form'],
            ['loop', ['form*', 'form'],
                ['cond', ['nil?', 'form*'], ['"null"'],
                         ['number?', 'form*'], ['str', 'form*'],
                         ['symbol?', 'form*'], ['str', ':"', 'form*', ':"'],
                         ['boolean?', 'form*'], ['str', 'form*'],
                         'else', ['throw', ['js/Error.', ['str', '"invalid form: "', ['prn-str', 'form*']]]]]]]);

    evalJS(['defn', 'ident', ['x'], 'x']);
    evalJS(['defn', 'constantly', ['x'], ['fn', [], 'x']]);

    var api = {
        eval: evaluate,
        evalJS: evalJS,
        evalJSON: evalJSON,
        readJS: readJS,
        readJSON: readJSON,
        readString: readString,
        evalString: evalString,
        prn: prn,
        prnStr: prnStr,
        ok: ok,
        is: is,
        equals: equals,
        Keyword: Keyword,
        Symbol: Sym,
        Cons: Cons,
        Seq: Seq,
        List: List,
        LazyList: LazyList,
        ArrayMap: ArrayMap,
        Map: AMap,
        MapEntry: MapEntry,
        Namespace: Namespace,
        Var: Var,
        list: list,
        arrayMap: arrayMap,
        isSymbol: isSymbol,
        isString: isString,
        isKeyword: isKeyword,
        isMap: isMap,
        isSeq: isSeq,
        IMeta: IMeta,
        AReference: AReference
    };

    if (isNode) {
        var fs = require('fs');

        api.evalJSONFile = function(file) {
            var ret = null;
            JSON.parse(fs.readFileSync(file).toString()).forEach(function(line) {
                ret = evalJS(line);
            });
            return ret;
        };

        api.evalFile = function(file) {
            return evaluate(readString(fs.readFileSync(file).toString()));
        };

        module.exports = api;
    }

    return api;

}());
