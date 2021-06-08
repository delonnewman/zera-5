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
    } else if (isEnv(x)) {
        return "env";
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

