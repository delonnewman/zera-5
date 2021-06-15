import { APersistentSet } from "./APersistentSet";
import { ArrayMap } from "./ArrayMap";
import { zeraType } from "../types";
import { isArrayLike } from "../core";

@zeraType('zera.lang.HashSet', APersistentSet)
export class HashSet extends APersistentSet {

    static createFromArray(a: any[]): HashSet {
        var i,
            entries = [];
        for (i = 0; i < a.length; i++) {
            entries.push(a[i]);
            entries.push(a[i]);
        }
        return new HashSet(null, new ArrayMap(null, entries));
    }

    static EMPTY = new HashSet(null, ArrayMap.EMPTY);

    conj(vals: any[]): HashSet {
        var i,
            a = [];
        for (i = 0; i < vals.length; i++) {
            a.push([vals[i], vals[i]]);
        }
        return new HashSet(this.meta(), this.$zera$rep.conj(a));
    }

    disjoin(key: any): HashSet {
        if (this.contains(key)) {
            return new HashSet(this.meta(), this.$zera$rep.dissoc(key));
        }
        return this;
    }
}

export function createSet(seq: any): HashSet {
    if (seq == null) return HashSet.EMPTY;
    if (isArrayLike(seq)) {
        return HashSet.createFromArray(seq);
    } else {
        var x = seq.first();
        var xs = seq.rest();
        var a = [];
        while (xs.next()) {
            a.push(x);
            xs = xs.rest();
            x = xs.first();
        }
        return HashSet.createFromArray(a);
    }
}
