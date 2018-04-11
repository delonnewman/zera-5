// jshint esversion: 5
// jshint eqnull: true
// jshint evil: true

var zera = (function() {
    "use strict";

    var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    var isBrowser = typeof window !== 'undefined';

    // Cons

    function Cons(car, cdr) {
        this.$zera$car = car;
        this.$zera$cdr = cdr;
        if (car == null && cdr == null) {
            this.$zera$count = 0;
        }
        else if (cdr == null) {
            this.$zera$cdr = Cons.empty();
            this.$zera$count = 1;
        }
        else if (!(cdr instanceof Cons)) {
            this.$zera$count = 1;
        }
        else {
            this.$zera$count = cdr.count() + 1;
        }
    }

    Cons.empty = function() {
        return new Cons(null, null);
    };

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

    function isList(x) {
        if (x == null) return false;
        if (isJSFn(x.isList)) return true;
        return false;
    }

    // make a list out of conses
    function list() {
        if (arguments.length === 0) {
            return Cons.empty();
        }
        else if (arguments.length === 1) {
            return cons(arguments[0], Cons.empty());
        }
        var i, x;
        var xs = Cons.empty();
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

    //LazyList.prototype = Object.create(List.prototype);

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
        if (val == null) return Cons.empty();
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
    
    function ArrayMap(entries) {
        this.$zera$entries = entries;
        this.$zera$valCache = {};
    }

    ArrayMap.prototype.toString = function() {
        var buff = [], i;
        var entries = this.$zera$entries;
        for (i = 0; i < entries.length; i += 2) {
            buff.push(s(prnStr(entries[i]), ' ', prnStr(entries[i + 1])));
        }
        return s('{', buff.join(', '), '}');
    };

    ArrayMap.prototype.first = function() {
        return new MapEntry(this.$zera$entries[0], this.$zera$entries[1]);
    };

    ArrayMap.prototype.next = function() {
        return cdr(this.entries());
    };

    ArrayMap.prototype.rest = function() {
        var entries = this.entries();
        if (count(entries) === 0) return Cons.empty();
        return cdr(this.entries());
    };

    ArrayMap.prototype.conj = function(entries) {
        var i, x, m = this;
        for (i = 0; i < entries.length; i++) {
            x = mapEntry(entries[i]);
        }
    };

    ArrayMap.prototype.entries = function() {
        var entries = this.$zera$entries;
        var i;
        var res = [];
        for (i = 0; i < entries.length; i += 2) {
            res.push(new MapEntry(entries[i], entries[i + 1]));
        }
        return list.apply(null, res);
    };

    ArrayMap.prototype.keys = function() {
        var entries = this.$zera$entries;
        var i;
        var res = [];
        for (i = 0; i < entries.length; i += 2) {
            res.push(entries[i]);
        }
        return list.apply(null, res);
    };

    ArrayMap.prototype.vals = function() {
        var entries = this.$zera$entries;
        var i;
        var res = [];
        for (i = 0; i < entries.length; i += 2) {
            res.push(entries[i + 1]);
        }
        return list.apply(null, res);
    };

    ArrayMap.prototype.find = function(key) {
        if (this.$zera$valCache[key] != null) {
            return this.$zera$valCache[key];
        }
        var val, i, entries = this.$zera$entries;
        for (i = 0; i < entries.length; i += 2) {
            if (eq(entries[i], key)) {
                val = entries[i + 1];
                this.$zera$valCache[key] = val;
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
        var entries = Array.prototype.slice.call(this.$zera$entries);
        for (i = 0; i < pairs.length; i += 2) {
            entries.push(pairs[i]);
            entries.push(pairs[i + 1]);
        }
        return new ArrayMap(entries);
    };

    ArrayMap.prototype.dissoc = function() {
    };

    ArrayMap.prototype.isMap = function() {
        return true;
    };

    function isMap(x) {
        if (x == null) return false;
        if (isJSFn(x.isMap)) return true;
        return false;
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
        if (m.assoc) {
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
        var xs = col == null ? Cons.empty() : col;
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

    function io(r, w) {
        return {
            read: r,
            write: w
        };
    }

    var stdout;
    if (isNode) {
        stdout = io(
            null,
            function() {
                console.log(Array.prototype.slice(arguments).join(''));
            }
        );
    } else {
        stdout = io(
            null,
            function() {
                console.log(Array.prototype.slice(arguments).join(''));
            }
        );
    }

    function isIO(x) {
        return x != null && (x.read != null || x.write != null);
    }

    function print(x) {
        var output, io = stdout;
        if (isIO(x)) {
            io = x;
            output = Array.prototype.slice(arguments, 1).join('');
        } else {
            output = Array.prototype.slice(arguments).join('');
        }
        p(io);
        p(output);
        p(arguments);
        var writer = io.write;
        if (writer == null) {
            throw new Error('the IO object given is read only');
        }
        return writer.call(io, output);
    }

    function say() {
        return print.apply(null, [].concat(arguments, "\n"));
    }

    function prnStr(x) {
        if (x == null) return "nil";
        else if (isNumber(x)) return s(x);
        else if (isBoolean(x)) {
            return x ? "true" : "false";
        } else if (isSymbol(x)) {
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
                while (y != null) {
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
    function isSymbol(x) {
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
        if (a == null || a.length === 0) return Cons.empty();
        else if (a.length === 1) return cons(a[0], Cons.empty());
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
        return isBoolean(x) || isNumber(x) || x == null;
    }

    function eq(a, b) {
        if (a == null) {
            return b == null;
        } else if (isCons(a)) {
            if (isCons(b)) {
                var xa = car(a);
                var xb = car(b);
                var xsa = cdr(a);
                var xsb = cdr(b);
                while (!isEmpty(xsa) && !isEmpty(xsb)) {
                    if (xa !== xb) {
                        return false;
                    } else {
                        xa = car(xsa);
                        xb = car(xsb);
                        xsa = cdr(xsa);
                        xsb = cdr(xsb);
                    }
                }
                return true;
            } else {
                return false;
            }
        } else {
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
            p('env null');
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

    function define(env, name, value) {
        if (typeof value !== 'undefined') {
            env.vars[name] = value;
            return null;
        } else {
            env.vars[name] = null;
            return null;
        }
    }

    function findVar(env, name) {
        var scope = lookup(env, name);
        if (scope == null) {
            throw new Error(s('Undefined variable: "', name, '"'));
        } else {
            return scope.vars[name];
        }
    }

    function set(env, name, value) {
        var scope = lookup(env, name);
        if (scope == null) {
            throw new Error(s('Undefined variable: "', name, '"'));
        } else {
            scope.vars[name] = value;
            return value;
        }
    }

    function evalDefinition(form, env) {
        var rest = cdr(form);
        var name = car(rest);
        var value = car(cdr(rest));
        define(env, name);
        return define(env, name, evaluate(value, env));
    }

    function evalAssignment(form, env) {
        var rest = cdr(form);
        var name = car(rest);
        var value = car(cdr(rest));
        return set(env, name, evaluate(value, env));
    }

    function reverse(xs) {
        if (isEmpty(xs)) {
            return Cons.empty();
        } else {
            var xs_ = cdr(xs),
                x = car(xs),
                l = Cons.empty();
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
            return Cons.empty();
        } else if (count(xs) == 1) {
            return xs;
        } else {
            var xs_ = xs,
                x = car(xs_),
                y = car(cdr(xs_)),
                l = Cons.empty();
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
        return isPair(x) && car(car(x)) === 'fn';
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
            define(env, name, value);
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
        var arr = mapA(function(x) { return evaluate(x, env); }, args);
        if (isInvocable(fn)) {
            return fn.apply(null, arr);
        }
        var args_ = arrayToCons(arr);
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
        return cons(form, env(env_));
    }

    var MACROS = {};

    function evalMacroDefinition(form, env) {
        var rest = cdr(form),
            name = car(rest),
            fnrest = cdr(rest);
        MACROS[name] = evalFunction(cons("fn", fnrest), env);
        //prn(MACROS[name]);
        //prn(apply(MACROS[name], list(1, 2)));
        return name;
    }

    function isTaggedValue(x) {
        return isCons(x) && isSymbol(car(x));
    }

    function macroexpand(form) {
        if (isTaggedValue(form)) {
            var name = car(form);
            if (name != '.-' && name.startsWith('.-')) {
                return list('.', car(cdr(form)), name.slice(1));
            } else if (name != '.' && name.startsWith('.')) {
                return list('.', car(cdr(form)), cons(name.slice(1), cdr(cdr(form))));
            } else if (name.endsWith('.')) {
                return cons('new', cons(name.replace(/\.$/, ''), cdr(form)));
            } else {
                var macro = MACROS[name];
                if (macro != null) {
                    return macroexpand(apply(macro, cdr(form)));
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
            define(scope, name);
            evaled = evaluate(value, scope);
            define(scope, name, evaled);
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

    var top = env();

    function evaluate(form_, env_) {
        var env = env_ || top;
        var recur = true;
        var ret = null;
        var form = macroexpand(form_);
        while (recur) {
            recur = false;
            if (form == null) {
                ret = null;
            } else if (isAtom(form) || isJSFn(form) || isMap(form)) {
                ret = form;
            } else if (isSymbol(form)) {
                ret = findVar(env, form);
                //if (form === 'i') pt('evalVar i', ret);
            } else if (isCons(form)) {
                var tag = car(form);
                switch (tag) {
                    case 'quote':
                        ret = evalQuote(form);
                        break;
                    case 'def':
                        ret = evalDefinition(form, env);
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

    function readJSArray(exp) {
        if (exp.length === 0) return null;
        if (exp.length === 1) return cons(readJS(exp[0]), Cons.empty());
        var xs = null;
        var last = null, x;
        for (i = exp.length - 1; i >= 0; i--) {
            // use & to read pairs
            if (exp[i] === '&') {
                if (exp.length === 2) return cons(Cons.empty(), readJS(last));
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
    }

    function readJS(exp) {
        var i;
        if (isSymbol(exp)) {
            if (exp.startsWith(':') || exp.startsWith("'")) {
                return list('quote', exp.slice(1));
            } else if (exp.startsWith('"') && exp.endsWith('"')) {
                return list('quote', exp.slice(1).replace(/"$/, ''));
            } else {
                return exp;
            }
        } else if (isArray(exp)) {
            if (exp.length === 0) return null;
            if (exp.length === 1) return cons(readJS(exp[0]), Cons.empty());
            var xs = null;
            var last = null, x;
            for (i = exp.length - 1; i >= 0; i--) {
                // use & to read pairs
                if (exp[i] === '&') {
                    if (exp.length === 2) return cons(Cons.empty(), readJS(last));
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
            if (keys.length === 0) return null;
            var entries = [];
            for (i = 0; i < keys.length; i++) {
                entries.push(keys[i]);
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
    define(top, "eval", evaluate);
    define(top, "apply", apply);
    define(top, "macroexpand", macroexpand);
    define(top, "nil", null);
    define(top, "nil?", isNil);
    define(top, "empty?", isEmpty);
    define(top, "list", list);
    define(top, "array-map", arrayMap);
    define(top, "entries", entries);
    define(top, "get", get);
    define(top, "assoc", assoc);
    define(top, "keys", keys);
    define(top, "vals", vals);
    define(top, "key", key);
    define(top, "val", val);
    //define(top, "list?", isList);
    define(top, "cons", cons);
    define(top, "count", count);
    define(top, "car", car);
    define(top, "cdr", cdr);
    define(top, "map", map);
    define(top, "reduce", reduce);
    define(top, "filter", filter);
    define(top, "take", take);
    define(top, "range", range);
    define(top, "first", first);
    define(top, "rest", rest);
    define(top, "next", next);
    define(top, "conj", conj);
    define(top, "cons?", isCons);
    define(top, "pair?", isPair);
    define(top, "pair", pair);
    define(top, "prn-str", prnStr);
    define(top, "prn", prn);
    define(top, "p", p);
    define(top, "boolean?", isBoolean);
    define(top, "symbol?", isSymbol);
    define(top, "s", s);
    define(top, "number?", isNumber);
    define(top, "even?", isEven);
    define(top, "odd?", isOdd);
    define(top, "num", num);
    define(top, "is", is);
    define(top, "ok", ok);
    define(top, "cons->array", consToArray);
    define(top, "array->cons", arrayToCons);
    define(top, "array?", isArray);
    define(top, 'areduce', areduce);
    define(top, 'amap', amap);
    define(top, 'afilter', afilter);
    define(top, 'aset', aset);
    define(top, 'aget', aget);
    define(top, "array", function() {
        return Array.prototype.slice.call(arguments);
    });
    define(top, "object->pairs", objectToPairs);
    define(top, "object?", isObject);
    define(top, "read-js", readJS);
    define(top, "read-json", readJSON);

    define(top, "io", io);
    define(top, "io?", isIO);
    define(top, "stdout", stdout);
    define(top, "print", print);
    define(top, "say", say);

    define(top, "identical?", function(a, b) {
        return a === b;
    });
    define(top, "equiv?", function(a, b) {
        return a == b;
    });

    define(top, "not", function(x) {
        return !x;
    });

    define(top, "bit-not", function(x) {
        return ~x;
    });
    define(top, "bit-and", function(a, b) {
        return a & b;
    });
    define(top, "bit-or", function(a, b) {
        return a || b;
    });
    define(top, "bit-shift-left", function(a, b) {
        return a << b;
    });
    define(top, "bit-shift-right", function(a, b) {
        return a >> b;
    });
    define(top, "unsigned-bit-shift-right", function(a, b) {
        return a >>> b;
    });

    define(top, "=", eq);

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
    define(top, '<', lt);

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
    define(top, '<=', lteq);

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
    define(top, '>', gt);

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
    define(top, '>=', gteq);

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
    define(top, "+", add);

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
    define(top, '-', sub);

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
    define(top, '*', mult);

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
    define(top, '/', div);

    function symbolImporter(ns) {
        return function(name) {
            try {
                var val = eval(name);
                if (val != null) {
                    define(top, s(ns, '/', name), val);
                }
            } catch (e) {
                //console.error(e);
            }
        };
    }

    define(top, '*platform*', 'js');

    define(top, 'math/pi', Math.PI);
    define(top, 'math/e',  Math.E);

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
    ].forEach(symbolImporter('js'));

    if (isBrowser) {
        define(top, '*platform*', 'js/browser');
    }


    if (isNode) {
        define(top, '*platform*', "js/node");
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
        ].forEach(symbolImporter('js.node'));
    }

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
    ].forEach(symbolImporter('js.dom'));

    evalJS(
        ['defmacro', 'defn', ['name', 'args', '&', 'body'],
            ['list', "'def", 'name', ['cons', "'fn", ['cons', 'args', 'body']]]]);

    var api = {
        eval: evaluate,
        evalJS: evalJS,
        evalJSON: evalJSON,
        readJS: readJS,
        readJSON: readJSON,
        arrayToCons: arrayToCons,
        consToArray: consToArray,
        objectToPairs: objectToPairs,
        isFn: isFn,
        isSymbol: isSymbol,
        isBoolean: isBoolean,
        isNumber: isNumber,
        isArray: isArray,
        isArrayLike: isArrayLike,
        isAtom: isAtom,
        isNil: isNil,
        isCons: isCons,
        cons: cons,
        count: count,
        car: car,
        cdr: cdr,
        isPair: isPair,
        pair: pair,
        list: list,
        first: car,
        rest: cdr,
        prn: prn,
        prnStr: prnStr,
        ok: ok,
        is: is,
        eq: eq,
        num: num,
        s: s
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
            return evalString(fs.readFileSync(file).toString());
        };

        module.exports = api;
    }

    return api;

}());
