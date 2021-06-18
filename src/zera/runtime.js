"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.isEmpty = exports.second = exports.rest = exports.next = exports.first = exports.conj = exports.count = exports.isOdd = exports.isEven = exports.isObject = exports.isDate = exports.isRegExp = exports.isZero = exports.isNegative = exports.isPositive = exports.num = exports.isNumber = exports.isJSFn = exports.isEquiv = exports.isIdentical = exports.equals = exports.isNil = exports.RecursionPoint = exports.p = exports.SPECIAL_FORMS = exports.COLUMN_KEY = exports.LINE_KEY = exports.TAG_KEY = exports.MACRO_KEY = exports.DOC_KEY = exports.THE_VAR = exports.AMP_SYM = exports.MACRO_SYM = exports.DOT_SYM = exports.NEW_SYM = exports.THROW_SYM = exports.RECUR_SYM = exports.LOOP_SYM = exports.COND_SYM = exports.LET_SYM = exports.FN_SYM = exports.SET_SYM = exports.DEF_SYM = exports.DO_SYM = exports.DEREF_SYM = exports.QUOTE_SYM = exports.FALSE_SYM = exports.TRUE_SYM = exports.NIL_SYM = void 0;
exports.zeraNameToJS = exports.ahead = exports.alast = exports.array = exports.into = exports.objectToMap = exports.pair = exports.gensym = exports.list = exports.cons = exports.seq = exports.intoArray = exports.floatArray = exports.intArray = exports.alength = exports.aset = exports.aget = exports.isArrayLike = exports.isArray = exports.str = exports.isError = exports.isString = exports.isFalsy = exports.isFalse = exports.isTrue = exports.isBoolean = exports.prn = exports.prnStr = exports.pt = exports.arrayToList = exports.remove = exports.filter = exports.map = exports.join = exports.reduce = void 0;
var lang_1 = require("./lang");
__exportStar(require("./lang"), exports);
// Global Symbols
exports.NIL_SYM = lang_1.Symbol.intern("nil");
exports.TRUE_SYM = lang_1.Symbol.intern("true");
exports.FALSE_SYM = lang_1.Symbol.intern("false");
exports.QUOTE_SYM = lang_1.Symbol.intern("quote");
exports.DEREF_SYM = lang_1.Symbol.intern("deref");
exports.DO_SYM = lang_1.Symbol.intern("do");
exports.DEF_SYM = lang_1.Symbol.intern("def");
exports.SET_SYM = lang_1.Symbol.intern("set!");
exports.FN_SYM = lang_1.Symbol.intern("fn");
exports.LET_SYM = lang_1.Symbol.intern("let");
exports.COND_SYM = lang_1.Symbol.intern("cond");
exports.LOOP_SYM = lang_1.Symbol.intern("loop");
exports.RECUR_SYM = lang_1.Symbol.intern("recur");
exports.THROW_SYM = lang_1.Symbol.intern("throw");
exports.NEW_SYM = lang_1.Symbol.intern("new");
exports.DOT_SYM = lang_1.Symbol.intern(".");
exports.MACRO_SYM = lang_1.Symbol.intern("defmacro");
exports.AMP_SYM = lang_1.Symbol.intern("&");
exports.THE_VAR = lang_1.Symbol.intern("var");
exports.DOC_KEY = lang_1.keyword("doc");
exports.MACRO_KEY = lang_1.keyword("macro");
exports.TAG_KEY = lang_1.keyword("tag");
exports.LINE_KEY = lang_1.keyword("line");
exports.COLUMN_KEY = lang_1.keyword("colunm");
exports.SPECIAL_FORMS = {
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
    'var': true,
    'do': true,
    'let': true,
};
exports.p = console.log.bind(console.log);
var RecursionPoint = /** @class */ (function () {
    function RecursionPoint(args) {
        this.args = args;
    }
    return RecursionPoint;
}());
exports.RecursionPoint = RecursionPoint;
function isNil(x) {
    return x == null;
}
exports.isNil = isNil;
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
exports.equals = equals;
function isIdentical(a, b) {
    return a === b;
}
exports.isIdentical = isIdentical;
function isEquiv(a, b) {
    return a == b;
}
exports.isEquiv = isEquiv;
function isJSFn(x) {
    return Object.prototype.toString.call(x) === "[object Function]";
}
exports.isJSFn = isJSFn;
function isNumber(x) {
    return (!isNaN(x) && Object.prototype.toString.call(x) === "[object Number]");
}
exports.isNumber = isNumber;
function num(x) {
    var type = Object.prototype.toString.call(x);
    if (type === "[object Number]") {
        return x;
    }
    else if (type === "[object String]") {
        var x_ = 1 * x;
        if (isNaN(x_))
            throw new Error(str("Cannot convert: ", prnStr(x), " to a number"));
        return x_;
    }
    else {
        throw new Error(str("Cannot convert: ", prnStr(x), " to a number"));
    }
}
exports.num = num;
function isPositive(x) {
    return x > 0;
}
exports.isPositive = isPositive;
function isNegative(x) {
    return x < 0;
}
exports.isNegative = isNegative;
function isZero(x) {
    return x === 0;
}
exports.isZero = isZero;
function isRegExp(x) {
    return Object.prototype.toString.call(x) === "[object RegExp]";
}
exports.isRegExp = isRegExp;
function isDate(x) {
    return Object.prototype.toString.call(x) === "[object Date]";
}
exports.isDate = isDate;
function isObject(x) {
    return Object.prototype.toString.call(x) === "[object Object]";
}
exports.isObject = isObject;
function isEven(x) {
    return x % 2 === 0;
}
exports.isEven = isEven;
function isOdd(x) {
    return Math.abs(x % 2) === 1;
}
exports.isOdd = isOdd;
// Collection interface
function count(col) {
    // nil
    if (col == null) {
        return 0;
    }
    else if (isJSFn(col.count)) {
        return col.count();
    }
    else if (lang_1.isSeq(col)) {
        var n = 0, s;
        for (s = col; s != null; s = s.next()) {
            n++;
        }
        return n;
    }
    // array-like
    else if (col.length != null) {
        return col.length;
    }
    else {
        throw new Error(str("Don't know how to get the count of: ", prnStr(col)));
    }
}
exports.count = count;
function conj(col) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var xs = col == null ? lang_1.PersistentList.EMPTY : col;
    if (isJSFn(xs.conj))
        return xs.conj(args);
    else if (isArrayLike(xs)) {
        var i = 0;
        for (; i < args.length; i++) {
            xs.push(args[i]);
        }
        return xs;
    }
    else {
        throw new Error(str("Don't know how to conj: ", prnStr(xs)));
    }
}
exports.conj = conj;
function first(xs) {
    var s = seq(xs);
    if (s != null) {
        return s.first();
    }
    return s;
}
exports.first = first;
function next(xs) {
    var s = seq(xs);
    if (s != null) {
        return s.next();
    }
    return s;
}
exports.next = next;
function rest(xs) {
    var x = next(xs);
    if (x == null) {
        return lang_1.PersistentList.EMPTY;
    }
    return x;
}
exports.rest = rest;
function second(xs) {
    return first(rest(xs));
}
exports.second = second;
function isEmpty(x) {
    if (x == null)
        return true;
    else if (lang_1.isSeq(x)) {
        return x.next() == null && x.first() == null;
    }
    else if (isJSFn(x.isEmpty))
        return x.isEmpty();
    else if (isJSFn(x.count))
        return x.count() === 0;
    else if (isArrayLike(x))
        return x.length === 0;
    else {
        throw new Error(str("Don't know hot to determine if: ", prnStr(x), " is empty"));
    }
}
exports.isEmpty = isEmpty;
function apply(fn, args) {
    if (args === void 0) { args = lang_1.PersistentList.EMPTY; }
    if (isArrayLike(fn)) {
        return fn[first(args)];
    }
    else if (isJSFn(fn.apply)) {
        return fn.apply(null, intoArray(args));
    }
    else {
        throw new Error("Not a valid function: " + prnStr(fn));
    }
}
exports.apply = apply;
function reduce(f) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var x, init, xs;
    if (args.length === 2) {
        xs = args[1];
        init = first(xs);
        xs = rest(xs);
    }
    else if (args.length === 3) {
        init = args[1];
        xs = args[2];
    }
    else {
        throw new Error(str("Expected either 2 or 3 arguments, got: ", arguments.length));
    }
    while (!isEmpty(xs)) {
        x = first(xs);
        init = apply(f, list(init, x));
        xs = rest(xs);
    }
    return init;
}
exports.reduce = reduce;
function join(col, delimiter) {
    return reduce(function (s, x) { return s == null ? str(x) : str(s, delimiter, x); }, col);
}
exports.join = join;
// TODO: look into transducers
function map(f, xs) {
    if (arguments.length === 2) {
        return lang_1.lazySeq(function () {
            if (isEmpty(xs)) {
                return null;
            }
            return cons(apply(f, list(first(xs))), map(f, rest(xs)));
        });
    }
    else {
        throw new Error(str("Expected 2 arguments, got: ", arguments.length));
    }
}
exports.map = map;
function filter(f, xs) {
    return lang_1.lazySeq(function () {
        if (isEmpty(xs)) {
            return null;
        }
        var x = first(xs), pred = apply(f, list(x));
        if (isFalsy(pred)) {
            return filter(f, rest(xs));
        }
        else {
            return cons(x, filter(f, rest(xs)));
        }
    });
}
exports.filter = filter;
function remove(f, xs) {
    if (arguments.length === 2) {
        return lang_1.lazySeq(function () {
            if (isEmpty(xs)) {
                return null;
            }
            var x = first(xs), pred = apply(f, list(x));
            if (!isFalsy(pred)) {
                return remove(f, rest(xs));
            }
            else {
                return cons(x, remove(f, rest(xs)));
            }
        });
    }
    else {
        throw new Error(str("Expected 2 arguments, got: ", arguments.length));
    }
}
exports.remove = remove;
function arrayToList(a) {
    if (a == null || a.length === 0) {
        return lang_1.PersistentList.EMPTY;
    }
    else if (a.length === 1) {
        return cons(a[0], lang_1.PersistentList.EMPTY);
    }
    var i;
    var list = null;
    for (i = a.length - 1; i >= 0; i--) {
        list = cons(a[i], list);
    }
    return list;
}
exports.arrayToList = arrayToList;
function pt(tag, val) {
    console.log(str(tag, ": ", prnStr(val)));
}
exports.pt = pt;
function prnStr(x) {
    if (x == null)
        return "nil";
    else if (isNumber(x))
        return str(x);
    else if (isBoolean(x)) {
        return x ? "true" : "false";
    }
    else if (isString(x)) {
        return str('"', x, '"');
    }
    else if (lang_1.isLazySeq(x)) {
        return "(...)";
    }
    else if (lang_1.isList(x)) {
        if (isEmpty(x)) {
            return "()";
        }
        else {
            var y;
            var ys = x;
            var buffer = [];
            while (ys !== null) {
                y = first(ys);
                ys = next(ys);
                buffer.push(prnStr(y));
            }
            return str("(", buffer.join(" "), ")");
        }
    }
    else if (isArray(x)) {
        if (x.length === 0) {
            return "(array)";
        }
        return str("(array ", x.map(prnStr).join(" "), ")");
    }
    else if (isJSFn(x)) {
        if (x.$zera$tag != null) {
            return str(x.$zera$tag);
        }
        return str('#js/function "', x.toString(), '"');
    }
    else if (isArrayLike(x)) {
        if (x.toString) {
            return x.toString();
        }
        else {
            return str("#js/object {", Array.prototype.slice
                .call(x)
                .map(function (x, i) {
                return str(i, " ", prnStr(x));
            })
                .join(", "), "}");
        }
    }
    else {
        return "" + x;
    }
}
exports.prnStr = prnStr;
function prn(x) {
    console.log(prnStr(x));
}
exports.prn = prn;
function isBoolean(x) {
    return Object.prototype.toString.call(x) === "[object Boolean]";
}
exports.isBoolean = isBoolean;
function isTrue(x) {
    return x === true;
}
exports.isTrue = isTrue;
function isFalse(x) {
    return x === false;
}
exports.isFalse = isFalse;
function isFalsy(x) {
    return x === false || x == null;
}
exports.isFalsy = isFalsy;
// symbols can be quoted with ":", "'" or by surrounding in "'s
function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
}
exports.isString = isString;
function isError(x) {
    return Object.prototype.toString.call(x) === "[object Error]";
}
exports.isError = isError;
function str() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return args.join("");
}
exports.str = str;
function isArray(x) {
    return Object.prototype.toString.call(x) === "[object Array]";
}
exports.isArray = isArray;
function isArrayLike(x) {
    return x != null && isNumber(x.length) && !isJSFn(x);
}
exports.isArrayLike = isArrayLike;
function aget(a, i) {
    return a == null ? null : a[i];
}
exports.aget = aget;
function aset(a, i, v) {
    if (a != null)
        a[i] = v;
    return a;
}
exports.aset = aset;
function alength(a) {
    return a.length;
}
exports.alength = alength;
function intArray(x) {
    if (isNumber(x) || isArray(x)) {
        return new Int32Array(x);
    }
    else if (lang_1.isSeq(x)) {
        return new Int32Array(intoArray(x));
    }
    throw new Error(str("Don't know how to convert ", prnStr(x), " into an Int32Array"));
}
exports.intArray = intArray;
function floatArray(x) {
    if (isNumber(x) || isArray(x)) {
        return new Float32Array(x);
    }
    else if (lang_1.isSeq(x)) {
        return new Float32Array(intoArray(x));
    }
    throw new Error(str("Don't know how to convert ", prnStr(x), " into an Float32Array"));
}
exports.floatArray = floatArray;
function intoArray(from) {
    var a = [];
    if (from == null) {
        return a;
    }
    else if (isJSFn(from.toArray)) {
        return from.toArray();
    }
    else if (isArray(from)) {
        return from;
    }
    else if (lang_1.isSeq(from) || lang_1.isSeqable(from)) {
        var s;
        for (s = seq(from); s != null; s = s.next()) {
            a.push(s.first());
        }
        return a;
    }
    else {
        throw new Error(str("Don't know how to convert ", prnStr(from), " into an array"));
    }
}
exports.intoArray = intoArray;
function seq(value) {
    if (value == null)
        return null;
    else if (lang_1.isSeq(value)) {
        if (isEmpty(value))
            return null;
        else
            return value;
    }
    else if (isJSFn(value.seq)) {
        var s = value.seq();
        if (isEmpty(s))
            return null;
        return s;
    }
    else if (isArrayLike(value)) {
        if (value.length === 0)
            return null;
        else
            return arrayToList(value);
    }
    else {
        throw new Error(prnStr(value) + " is not a valid Seq or Seqable");
    }
}
exports.seq = seq;
function cons(x, col) {
    if (col == null) {
        return new lang_1.PersistentList(null, x, null, 1);
    }
    else if (lang_1.isSeq(col)) {
        return col.cons(x);
    }
    else if (lang_1.isSeqable(col)) {
        var s = seq(col);
        if (s == null)
            return lang_1.PersistentList.EMPTY.cons(x);
        else
            return s.cons(x);
    }
    else {
        throw new Error(str("Don't know how to cons: ", prnStr(col)));
    }
}
exports.cons = cons;
function list() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (args.length === 0) {
        return lang_1.PersistentList.EMPTY;
    }
    else if (args.length === 1) {
        return cons(args[0], null);
    }
    var i, x;
    var xs = null;
    for (i = args.length - 1; i >= 0; i--) {
        x = args[i];
        xs = cons(x, xs);
    }
    return xs;
}
exports.list = list;
var symN = lang_1.atom(1);
function inc(x) {
    return x + 1;
}
function gensym(prefix) {
    if (prefix === void 0) { prefix = "G__"; }
    var s = lang_1.Symbol.intern([prefix, symN.deref()].join(""));
    lang_1.swap(symN, inc);
    return s;
}
exports.gensym = gensym;
function pair(xs) {
    if (isNil(xs)) {
        return lang_1.Vector.EMPTY;
    }
    else if (count(xs) === 1) {
        return xs;
    }
    else {
        var xs_ = xs, x = first(xs_), y = first(rest(xs_)), v = lang_1.Vector.EMPTY;
        while (xs_ !== null) {
            v = v.conj(lang_1.vector(x, y));
            xs_ = next(rest(xs_));
            x = first(xs_);
            y = first(rest(xs_));
        }
        return v;
    }
}
exports.pair = pair;
function objectToMap(obj, keyFn) {
    if (keyFn === void 0) { keyFn = lang_1.keyword; }
    if (obj == null)
        return lang_1.ArrayMap.EMPTY;
    var keys = Object.getOwnPropertyNames(obj);
    if (keys.length === 0)
        return null;
    var i, entries = [];
    for (i = 0; i < keys.length; i++) {
        entries.push(apply(keyFn, [keys[i]]));
        entries.push(obj[keys[i]]);
    }
    return new lang_1.ArrayMap(null, entries);
}
exports.objectToMap = objectToMap;
// TODO: add a toTrasient method to all Seq's
function into(to, from) {
    while (first(from) != null) {
        to = conj(to, first(from));
        from = rest(from);
    }
    return to;
}
exports.into = into;
function array() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return args;
}
exports.array = array;
function alast(array) {
    if (array.length === 0)
        return null;
    else if (array.length === 1)
        return array[0];
    else {
        return array[array.length - 1];
    }
}
exports.alast = alast;
function ahead(array) {
    if (array.length === 0 || array.length === 1) {
        return [];
    }
    else {
        return array.slice(0, array.length - 1);
    }
}
exports.ahead = ahead;
var names = {
    "=": "eq",
    "not=": "noteq",
    "<": "lt",
    ">": "gt",
    "<=": "lteq",
    ">=": "gteq",
    "+": "add",
    "-": "sub",
    "*": "mult",
    "/": "div",
};
function zeraNameToJS(x) {
    if (names[x])
        return names[x];
    var prefix = null, parts;
    if (x.endsWith("?")) {
        prefix = "is";
        x = x.slice(0, x.length - 1);
    }
    else if (x.endsWith("!")) {
        x = x.slice(0, x.length - 1);
    }
    else if (x.startsWith("*") && x.endsWith("*")) {
        return x
            .slice(0, x.length - 1)
            .slice(1)
            .split("-")
            .map(function (s) {
            return s.toUpperCase();
        })
            .join("_");
    }
    if (x.indexOf("->") !== -1) {
        parts = x.split("->").reduce(function (a, x) { return [].concat(a, "to", x); });
    }
    else {
        parts = prefix ? [].concat(prefix, x.split("-")) : x.split("-");
    }
    return [].concat(parts[0], parts.slice(1).map(cap)).join("");
}
exports.zeraNameToJS = zeraNameToJS;
