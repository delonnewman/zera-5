import { zeraType } from "../types";
import { count, List, ISeq, MetaData, PersistentList } from "../runtime";

@zeraType('zera.lang.Cons', List)
export class Cons extends List {
    private _first: any;
    private _more: ISeq;

    constructor(meta: MetaData | null, first: any, more: ISeq) {
        super(meta);
        this._first = first;
        this._more = more;
    }

    cons(value: any): Cons {
        return new Cons(this.meta(), value, this);
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

    // IMeta
    withMeta(meta: MetaData) {
        return new Cons(meta, this._first, this._more);
    }
}

export function isCons(x: any): boolean {
    return x instanceof Cons;
}
