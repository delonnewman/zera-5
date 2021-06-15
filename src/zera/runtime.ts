import {
    Symbol,
    symbol,
    keyword,
    isKeyword,
    isSeq,
    ISeq,
    isSeqable,
    ArrayLike,
    PersistentList,
    isList,
    lazySeq,
    isLazySeq,
    Applicable
} from "./lang";

// Global Symbols
export const NIL_SYM = Symbol.intern("nil");
export const TRUE_SYM = Symbol.intern("true");
export const FALSE_SYM = Symbol.intern("false");
export const QUOTE_SYM = Symbol.intern("quote");
export const DEREF_SYM = Symbol.intern("deref");
export const DO_SYM = Symbol.intern("do");
export const DEF_SYM = Symbol.intern("def");
export const SET_SYM = Symbol.intern("set!");
export const FN_SYM = Symbol.intern("fn");
export const LET_SYM = Symbol.intern("let");
export const COND_SYM = Symbol.intern("cond");
export const LOOP_SYM = Symbol.intern("loop");
export const RECUR_SYM = Symbol.intern("recur");
export const THROW_SYM = Symbol.intern("throw");
export const NEW_SYM = Symbol.intern("new");
export const DOT_SYM = Symbol.intern(".");
export const MACRO_SYM = Symbol.intern("defmacro");
export const AMP_SYM = Symbol.intern("&");
export const THE_VAR = Symbol.intern("var");

export const SPECIAL_FORMS = {
    nil: true,
    true: true,
    false: true,
    quote: true,
    def: true,
    "set!": true,
    fn: true,
    cond: true,
    loop: true,
    recur: true,
    throw: true,
    new: true,
    ".": true,
    defmacro: true,
    var: true,
    do: true,
    let: true,
};


export const DOC_KEY = keyword("doc");
export const MACRO_KEY = keyword("macro");

export const p = console.log.bind(console.log);

export type Env = { vars: { [key: string]: any } };

export class RecursionPoint {
    public args: any[];

    constructor(args: any[]) {
        this.args = args;
    }
}

export function isNil(x: any): boolean {
    return x == null;
}

export function equals(a: any, b: any): boolean {
    if (a == null) {
        return b == null;
    } else if (isJSFn(a.equals)) {
        return a.equals(b);
    } else {
        return a === b;
    }
}

export function isJSFn(x: any): boolean {
    return Object.prototype.toString.call(x) === "[object Function]";
}

export function isNumber(x: any): boolean {
    return (
        !isNaN(x) && Object.prototype.toString.call(x) === "[object Number]"
    );
}

export function num(x: any): number {
    var type = Object.prototype.toString.call(x);
    if (type === "[object Number]") {
        return x;
    } else if (type === "[object String]") {
        var x_ = 1 * x;
        if (isNaN(x_))
            throw new Error(
                str("Cannot convert: ", prnStr(x), " to a number")
            );
        return x_;
    } else {
        throw new Error(str("Cannot convert: ", prnStr(x), " to a number"));
    }
}

export function isPositive(x: any): boolean {
    return x > 0;
}

export function isNegative(x: any): boolean {
    return x < 0;
}

export function isZero(x: any): boolean {
    return x === 0;
}

export function isRegExp(x: any): boolean {
    return Object.prototype.toString.call(x) === "[object RegExp]";
}

export function isDate(x: any): boolean {
    return Object.prototype.toString.call(x) === "[object Date]";
}

export function isObject(x: any): boolean {
    return Object.prototype.toString.call(x) === "[object Object]";
}

export function isEven(x: any): boolean {
    return x % 2 === 0;
}

export function isOdd(x: any): boolean {
    return Math.abs(x % 2) === 1;
}

// Collection interface

export function count(col: any): number {
    // nil
    if (col == null) {
        return 0;
    } else if (isJSFn(col.count)) {
        return col.count();
    } else if (isSeq(col)) {
        var n = 0,
            s;
        for (s = col; s != null; s = s.next()) {
            n++;
        }
        return n;
    }
    // array-like
    else if (col.length != null) {
        return col.length;
    } else {
        throw new Error(
            str("Don't know how to get the count of: ", prnStr(col))
        );
    }
}

export function conj(col: any, ...args: any[]) {
    var xs = col == null ? PersistentList.EMPTY : col;
    if (isJSFn(xs.conj)) return xs.conj(args);
    else if (isArrayLike(xs)) {
        let i = 0;
        for (; i < args.length; i++) {
            xs.push(args[i]);
        }
        return xs;
    } else {
        throw new Error(str("Don't know how to conj: ", prnStr(xs)));
    }
}

export function first(xs: any): any {
    var s = seq(xs);
    if (s != null) {
        return s.first();
    }
    return s;
}

export function next(xs: any): ISeq | null {
    var s = seq(xs);
    if (s != null) {
        return s.next();
    }
    return s;
}

export function rest(xs: any): ISeq {
    var x = next(xs);
    if (x == null) {
        return PersistentList.EMPTY;
    }
    return x;
}

export function second(xs: any): any {
    return first(rest(xs));
}

export function isEmpty(x: any): boolean {
    if (x == null) return true;
    else if (isSeq(x)) {
        return x.next() == null && x.first() == null;
    } else if (isJSFn(x.isEmpty)) return x.isEmpty();
    else if (isJSFn(x.count)) return x.count() === 0;
    else if (isArrayLike(x)) return x.length === 0;
    else {
        throw new Error(
            str("Don't know hot to determine if: ", prnStr(x), " is empty")
        );
    }
}

export function apply(fn: any, args: ISeq | null = PersistentList.EMPTY): any {
    if (isArrayLike(fn)) {
        return fn[first(args)];
    }
    else if (isJSFn(fn.apply)) {
        return fn.apply(null, intoArray(args));
    } else {
        throw new Error(`Not a valid function: ${prnStr(fn)}`);
    }
}

export function reduce(f: Applicable, ...args: any[]): any {
    var x, init, xs;

    if (args.length === 2) {
        xs = args[1];
        init = first(xs);
        xs = rest(xs);
    } else if (args.length === 3) {
        init = args[1];
        xs = args[2];
    } else {
        throw new Error(
            str("Expected either 2 or 3 arguments, got: ", arguments.length)
        );
    }

    while (!isEmpty(xs)) {
        x = first(xs);
        init = apply(f, list(init, x));
        xs = rest(xs);
    }

    return init;
}

export function join(col: any, delimiter: string): string {
    return reduce((s: any, x: any) => s == null ? str(x) : str(s, delimiter, x), col);
}

// TODO: look into transducers
export function map(f: Applicable, xs: ISeq | ArrayLike) {
    if (arguments.length === 2) {
        return lazySeq(function() {
            if (isEmpty(xs)) {
                return null;
            }
            return cons(apply(f, list(first(xs))), map(f, rest(xs)));
        });
    } else {
        throw new Error(
            str("Expected 2 arguments, got: ", arguments.length)
        );
    }
}

export function filter(f: Applicable, xs: ISeq | ArrayLike) {
    return lazySeq(() => {
        if (isEmpty(xs)) {
            return null;
        }

        var x = first(xs),
            pred = apply(f, list(x));

        if (isFalsy(pred)) {
            return filter(f, rest(xs));
        } else {
            return cons(x, filter(f, rest(xs)));
        }
    });
}

export function remove(f: Applicable, xs: ISeq | ArrayLike) {
    if (arguments.length === 2) {
        return lazySeq(function() {
            if (isEmpty(xs)) {
                return null;
            }
            var x = first(xs),
                pred = apply(f, list(x));
            if (!isFalsy(pred)) {
                return remove(f, rest(xs));
            } else {
                return cons(x, remove(f, rest(xs)));
            }
        });
    } else {
        throw new Error(
            str("Expected 2 arguments, got: ", arguments.length)
        );
    }
}

export function arrayToList(a: any[]): ISeq | null {
    if (a == null || a.length === 0) {
        return PersistentList.EMPTY;
    }
    else if (a.length === 1) {
        return cons(a[0], PersistentList.EMPTY);
    }

    var i;
    var list = null;
    for (i = a.length - 1; i >= 0; i--) {
        list = cons(a[i], list);
    }

    return list;
}

export function pt(tag: string, val: any): void {
    console.log(str(tag, ": ", prnStr(val)));
}

export function prnStr(x: any): string {
    if (x == null) return "nil";
    else if (isNumber(x)) return str(x);
    else if (isBoolean(x)) {
        return x ? "true" : "false";
    } else if (isString(x)) {
        return str('"', x, '"');
    } else if (isLazySeq(x)) {
        return "(...)";
    } else if (isList(x)) {
        if (isEmpty(x)) {
            return "()";
        } else {
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
    } else if (isArray(x)) {
        if (x.length === 0) {
            return "(array)";
        }
        return str("(array ", x.map(prnStr).join(" "), ")");
    } else if (isJSFn(x)) {
        if (x.$zera$tag != null) {
            return str(x.$zera$tag);
        }
        return str('#js/function "', x.toString(), '"');
    } else if (isArrayLike(x)) {
        if (x.toString) {
            return x.toString();
        } else {
            return str(
                "#js/object {",
                Array.prototype.slice
                    .call(x)
                    .map(function(x, i) {
                        return str(i, " ", prnStr(x));
                    })
                    .join(", "),
                "}"
            );
        }
    } else {
        return "" + x;
    }
}

export function prn(x: any): void {
    console.log(prnStr(x));
}

export function isBoolean(x: any): boolean {
    return Object.prototype.toString.call(x) === "[object Boolean]";
}

export function isTrue(x: any): boolean {
    return x === true;
}

export function isFalse(x: any): boolean {
    return x === false;
}

export function isFalsy(x: any): boolean {
    return x === false || x == null;
}

// symbols can be quoted with ":", "'" or by surrounding in "'s
export function isString(x: any): boolean {
    return Object.prototype.toString.call(x) === "[object String]";
}

export function isError(x: any): boolean {
    return Object.prototype.toString.call(x) === "[object Error]";
}

export function str(...args: Array<any>): string {
    return args.join("");
}

export function isAtomic(x: any): boolean {
    return (
        isBoolean(x) ||
        isNumber(x) ||
        isString(x) ||
        isKeyword(x) ||
        x == null
    );
}

export function isArray(x: any): boolean {
    return Object.prototype.toString.call(x) === "[object Array]";
}

export function isArrayLike(x: any): boolean {
    return x != null && isNumber(x.length) && !isJSFn(x);
}

export function aget(a: Array<any>, i: number): any {
    return a == null ? null : a[i];
}

export function aset(a: Array<any>, i: number, v: any): Array<any> {
    if (a != null) a[i] = v;
    return a;
}

export function alength(a: Array<any>): number {
    return a.length;
}

export function intArray(x: any): Int32Array {
    if (isNumber(x) || isArray(x)) {
        return new Int32Array(x);
    } else if (isSeq(x)) {
        return new Int32Array(intoArray(x));
    }
    throw new Error(
        str("Don't know how to convert ", prnStr(x), " into an Int32Array")
    );
}

export function floatArray(x: any): Float32Array {
    if (isNumber(x) || isArray(x)) {
        return new Float32Array(x);
    } else if (isSeq(x)) {
        return new Float32Array(intoArray(x));
    }
    throw new Error(
        str(
            "Don't know how to convert ",
            prnStr(x),
            " into an Float32Array"
        )
    );
}

export function isAmp(x: any): boolean {
    return equals(x, AMP_SYM);
}

export function calculateArity(args: any[]): number {
    var argc = args.length,
        i = args.findIndex(isAmp);
    if (i !== -1) {
        argc = -1 * (argc - 1);
    }
    return argc;
}

export function bindArguments(names: any[], values: any[]): any[] {
    var i,
        xs,
        capture = false,
        args = [];
    for (i = 0; i < names.length; i++) {
        if (capture === true) {
            xs = values.slice(i - 1, values.length);
            args.push([names[i], list.apply(null, xs)]);
            break;
        } else {
            args.push([names[i], values[i]]);
        }
        if (equals(names[i], AMP_SYM)) capture = true;
    }
    return args;
}

export function defineLexically(env: Env, name: any, value: any) {
    if (typeof value !== "undefined") {
        env.vars[name] = value;
        return null;
    } else {
        env.vars[name] = null;
        return null;
    }
}

export function intoArray(from: any): any[] {
    var a: any[] = [];
    if (from == null) {
        return a;
    } else if (isJSFn(from.toArray)) {
        return from.toArray();
    } else if (isArray(from)) {
        return from;
    } else if (isSeq(from) || isSeqable(from)) {
        var s;
        for (s = seq(from); s != null; s = s.next()) {
            a.push(s.first());
        }
        return a;
    } else {
        throw new Error(
            str(
                "Don't know how to convert ",
                prnStr(from),
                " into an array"
            )
        );
    }
}

export function seq(value: any): ISeq | null {
    if (value == null) return null;
    else if (isSeq(value)) {
        if (isEmpty(value)) return null;
        else return value;
    } else if (isJSFn(value.seq)) {
        var s = value.seq();
        if (isEmpty(s)) return null;
        return s;
    } else if (isArrayLike(value)) {
        if (value.length === 0) return null;
        else return arrayToList(value);
    } else {
        throw new Error(`${prnStr(value)} is not a valid Seq or Seqable`);
    }
}


export function cons(x: any, col: ISeq | null): ISeq {
    if (col == null) {
        return new PersistentList(null, x, null, 1);
    } else if (isSeq(col)) {
        return col.cons(x);
    } else if (isSeqable(col)) {
        let s = seq(col);
        if (s == null) return PersistentList.EMPTY.cons(x);
        else return s.cons(x);
    } else {
        throw new Error(str("Don't know how to cons: ", prnStr(col)));
    }
}

export function list(...args: any[]): ISeq | null {
    if (args.length === 0) {
        return PersistentList.EMPTY;
    } else if (args.length === 1) {
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
