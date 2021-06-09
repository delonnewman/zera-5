import { zeraType } from "../types";
import { ISeq } from "./Seq";
import { IFn } from "./AFn";
import { list, str, prnStr, isArray, isJSFn } from "../core";

@zeraType('zera.lang.MapEntry')
export class MapEntry implements ISeq, IFn {
    private $zera$key: any;
    private $zera$val: any;

    constructor(key: any, val: any) {
        this.$zera$key = key;
        this.$zera$val = val;
    }

    key() {
        return this.$zera$key;
    }

    val() {
        return this.$zera$val;
    }

    first() {
        return this.key();
    }

    next() {
        return this.val();
    }

    rest() {
        return list(this.val());
    }

    cons(value: any): ISeq {
        throw new Error("MapEntry doesn't implement cons");
    }

    equals(value: any): boolean {
        if (!isMapEntry(value)) return false;

        return value.val() == this.val() && value.key() == value.key();
    }

    // TODO: Add indexed interface
    nth(n: number): any {
        if (n === 0) return this.key();
        else if (n === 1) return this.val();
        else {
            return null;
        }
    }

    invoke(...args: any[]) {
        if (args.length !== 1) {
            throw new Error(
                str(
                    "Wrong number of arguments got: ",
                    args.length,
                    ", expected: 1"
                )
            );
        }
        return this.nth(args[0]);
    }

    apply(_: any, args: any[]) {
        return this.invoke.apply(this, args);
    }

    call(_: any, ...args: any[]) {
        return this.invoke.apply(this, args);
    }

    toString(): string {
        return str("[", prnStr(this.key()), " ", prnStr(this.val()), "]");
    }
}

export function isMapEntry(x: any): boolean {
    return x instanceof MapEntry;
}

export function mapEntry(x: any): MapEntry {
    if (isMapEntry(x)) return x;
    else if (isArray(x) && x.length === 2) {
        return new MapEntry(x[0], x[1]);
    } else if (isVector(x) && x.count() === 2) {
        return new MapEntry(nth(x, 0), nth(x, 1));
    } else {
        throw new Error(
            str(
                "Don't know how to coerce '",
                prnStr(x),
                "' into a zera.MapEntry"
            )
        );
    }
}

export function key(m: MapEntry): any {
    if (isJSFn(m.key)) {
        return m.key();
    } else {
        throw new Error(str("Don't know how to get key from: ", prnStr(m)));
    }
}

export function val(m: MapEntry) {
    if (isJSFn(m.val)) {
        return m.val();
    } else {
        throw new Error(str("Don't know how to get val from: ", prnStr(m)));
    }
}
