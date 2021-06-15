import { IObj, AObj } from "./IObj";
import { MetaData } from "./IMeta";
import { ISeqable, ISeq } from "./Seq";
import { Counted } from "./Counted";
import { IFn } from "./AFn";
import { str, prnStr, arrayToList, equals, isArray, isJSFn, first, next, seq } from "../core";

// TODO: make Vector an abstract interface for PersistentVector and TransientVector
export class Vector extends AObj implements IObj, ISeqable, Counted, IFn {
    private _rep: any[];

    constructor(meta: MetaData | null, rep: any[]) {
        super(meta);
        this._rep = rep;
    }

    static EMPTY = new Vector(null, []);

    toString() {
        return str("[", this._rep.map(prnStr).join(" "), "]");
    }

    toArray() {
        return this._rep;
    }

    // IMeta
    meta() {
        return this.$zera$meta;
    }

    // Seqable
    seq(): ISeq {
        return arrayToList(this._rep);
    }

    count() {
        return this._rep.length;
    }

    // TODO: Define the interface that implements find
    find(index: number): any {
        return this._rep[index];
    }

    // alias find
    nth = this.find;

    contains(index: number): boolean {
        return this.find(index) != null;
    }

    conj(x: any): Vector {
        return new Vector(null, this._rep.concat(x));
    }

    // Array
    indexOf(value: any): number {
        return this._rep.indexOf(value);
    }

    findIndex(f: (element: any, index: number | undefined, array: any[] | undefined) => unknown): number {
        return this._rep.findIndex(f);
    }

    // Fn
    apply(_: any, args: any[]): any {
        return this.invoke.apply(this, args);
    }

    call(_: any, ...args: any[]): any {
        return this.invoke.apply(this, args);
    }

    invoke(...args: any[]): any {
        if (args.length !== 1) {
            throw new Error(str("Wrong number of arguments got: ", args.length, ", expected: 1"));
        }

        return this.find(args[0]);
    }

    // Equals
    equals(other: any): boolean {
        var a, b, i;
        if (!isVector(other)) {
            return false;
        } else if (this._rep.length !== other.rep.length) {
            return false;
        } else {
            a = this._rep;
            b = other.rep;
            for (i = 0; i < a.length; i++) {
                if (!equals(a[i], b[i])) return false;
            }
            return true;
        }
    }
}

export function nth(v: any, n: number): any {
    if (isArray(v)) return v[n];
    else if (isJSFn(v.nth)) return v.nth(n);
    else {
        throw new Error(
            str("Don't know how to get the nth element from: ", prnStr(v))
        );
    }
}

export function isVector(x: any): boolean {
    return x instanceof Vector;
}

export function vector(...args: any[]): Vector {
    return new Vector(null, args);
}

export function vec(s: ISeqable): Vector {
    var v = Vector.EMPTY,
        s_ = seq(s),
        x;
    while (s_ !== null) {
        x = first(s_);
        s_ = next(s_);
        v = v.conj(x);
    }
    return v;
}
