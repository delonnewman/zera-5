import { ISeq } from "./Seq";
import { List } from "./List";
import { Counted } from "./Counted";
import { MetaData } from "./IMeta";
import { zeraProtocol } from "../types";

// TODO: add IPersistentList, IPersistentStack, IReduce

@zeraProtocol('zera.lang.PersistentList', List)
export class PersistentList extends List implements Counted {
    private $zera$car: any;
    private $zera$cdr: ISeq | null;
    private $zera$count: number;

    constructor(meta: MetaData | null, car: any, cdr: ISeq | null, count: number) {
        super(meta);
        this.$zera$car = car;
        this.$zera$cdr = cdr;
        this.$zera$count = count;
    }

    static EMPTY = new PersistentList(null, null, null, 0);

    withMeta(meta: MetaData) {
        return new PersistentList(
            meta,
            this.$zera$car,
            this.$zera$cdr,
            this.$zera$count
        );
    }

    first(): any {
        return this.$zera$car;
    }

    rest(): any {
        if (this.next() == null) {
            return PersistentList.EMPTY;
        } else {
            return this.next();
        }
    }

    count(): number {
        return this.$zera$count;
    }

    next(): ISeq | null {
        return this.$zera$cdr;
    }

    cons(x: any): PersistentList {
        if (this.isEmpty()) {
            return new PersistentList(this.$zera$meta, x, null, 1);
        }
        return new PersistentList(
            this.$zera$meta,
            x,
            this,
            this.$zera$count + 1
        );
    }

    conj(vals: any[]): PersistentList {
        var i,
            xs: PersistentList = this;
        for (i = 0; i < vals.length; i++) {
            xs = xs.cons(vals[i]);
        }
        return xs;
    }

    isEmpty() {
        return this.$zera$count === 0;
    }

    // NOTE: not sure why this is necessary
    isList() {
        return true;
    }
}

export function isPersistentList(x: any): boolean {
    return x instanceof PersistentList;
}

