import { MetaData, ISeq, ASet, IPersistentCollection, Counted } from "./index";
import { str, intoArray, Map } from "../runtime";
import { zeraProtocol } from "../types";

export interface IPersistentSet extends IPersistentCollection, Counted {
    disjoin(key: any): IPersistentSet
    contains(key: any): boolean
    get(key: any): any
}

@zeraProtocol('zera.lang.APersistentSet', ASet)
export class APersistentSet extends ASet {
    protected $zera$rep: Map;

    constructor(meta: MetaData | null, rep: Map) {
        super(meta);
        this.$zera$rep = rep;
    }

    toString() {
        return str("#{", this.toArray().join(" "), "}");
    }

    toArray(): any[] {
        return intoArray(this.seq());
    }

    get(key: any): any {
        return this.$zera$rep.find(key);
    }

    count(): number {
        return this.$zera$rep.count();
    }

    seq(): ISeq {
        return this.$zera$rep.keys();
    }

    apply(_: any, args: any[]): any {
        return this.get(args[0]);
    }

    equals(other: any): boolean {
        return other instanceof APersistentSet && this.$zera$rep.equals(other.$zera$rep);
    }

    contains(val: any): boolean {
        return this.$zera$rep.containsKey(val);
    }

    first() {
        return this.seq().first();
    }

    rest() {
        return this.seq().rest();
    }

    next() {
        return this.seq().next();
    }
}
