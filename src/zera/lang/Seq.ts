import { IMeta } from "./IMeta"
import { IObj, AObj } from "./IObj"
import { zeraProtocol } from "../types"
import { equals, isJSFn, isArrayLike, ArrayLike } from "../core"

export interface ISeqable {
    seq(): ISeq;
}

export interface ISeq extends ISeqable {
    first(): any;
    rest(): ISeq;
    next(): ISeq | null;
    equals(other: any): boolean;
    cons(value: any): ISeq;
}

@zeraProtocol('zera.lang.Seq', AObj)
export class Seq extends AObj implements IObj, IMeta, ISeq {
    seq(): ISeq {
        return this;
    }

    first(): any {
        throw new Error("unimplmented");
    }

    rest(): ISeq {
        throw new Error("unimplmented");
    }

    next(): ISeq | null {
        throw new Error("unimplmented");
    }

    cons(value: any): ISeq {
        throw new Error("unimplmented");
    }

    // TODO: this should go elsewhere
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

export type Seqable = ISeqable | null | ArrayLike;

export function isSeq(value: any): boolean {
    return value instanceof Seq;
}

export function isSeqable(value: any) {
    if (value == null) return true;
    if (isArrayLike(value)) return true;
    return isJSFn(value.seq);
}
