import { Seq, ISeq } from "./Seq";
import { zeraType } from "../types";
import { MetaData } from "./IMeta";
import { count } from "../core";

@zeraType('zera.lang.Cons', List)
export class Cons extends Seq implements ISeq {
    private _first: any;
    private _more: ISeq;

    constructor(meta: MetaData, first: any, more: ISeq) {
        super(meta);
        this._first = first;
        this._more = more;
    }

    // ISeq
    first(): any {
        return this._first;
    }

    // ISeq
    more(): ISeq {
        if (this._more == null) return PersistentList.EMPTY;
        return this._more;
    }

    // ISeq
    next() {
        return this.more().seq();
    }

    count() {
        return 1 + count(this._more);
    }

    // Seqable
    seq() {
        return this;
    }

    // IMeta
    withMeta(meta: MetaData) {
        return new Cons(meta, this._first, this._more);
    }
}

export function isCons(x: any): boolean {
    return x instanceof Cons;
}
