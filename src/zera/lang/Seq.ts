import { IMeta } from "./IMeta"
import { IObj, AObj } from "./IObj"
import { zeraProtocol } from "../types"
import { equals, isEmpty, isJSFn, isArrayLike, arrayToList, prnStr } from "../core"

export interface ISeq {
    first(): any;
    rest(): Seq;
    next(): Seq | null;
    equals(other: any): boolean;
    cons(value: any): Seq;
}

@zeraProtocol('zera.lang.Seq', AObj)
export class Seq extends AObj implements IObj, IMeta, ISeq {
    first(): any {
        throw new Error("unimplmented");
    }

    rest(): Seq {
        throw new Error("unimplmented");
    }

    next(): Seq | null {
        throw new Error("unimplmented");
    }

    cons(value: any): Seq {
        throw new Error("unimplmented");
    }

    isEmpty(): boolean {
        throw new Error("unimplmented");
    }

    count(): number {
        throw new Error("unimplmented");
    }

    equals(other: any): boolean {
        var xa, xb, xsa, xsb;
        if (!isSeq(other)) {
            return false;
        } else if (this.isEmpty() && this.isEmpty()) {
            return true;
        } else if (this.count() != other.count()) {
            return false;
        } else {
            xsa = this;
            xsb = other;
            while (xsa != null) {
                xa = xsa.first();
                xb = xsb.first();
                if (!equals(xa, xb)) {
                    return false;
                }
                xsa = xsa.next();
                xsb = xsb.next();
            }
            return true;
        }
    }
}

export function seq(value: any): Seq | null {
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

export function isSeq(value: any): boolean {
    return value instanceof Seq;
}

export function isSeqable(value: any) {
    if (value == null) return true;
    if (isArrayLike(value)) return true;
    return isJSFn(value.seq);
}
