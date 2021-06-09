import { MetaData } from "./IMeta"
import { AMap, IMap } from "./AMap"
import { MapEntry, isMapEntry, mapEntry } from "./MapEntry"
import { zeraType } from "../types";
import { isArray, str, prnStr, equals } from "../core";
import { PersistentList } from "./PersistentList"
import { IFn } from "./AFn"

// TODO: add IHashEq
@zeraType('zera.lang.ArrayMap', AMap)
export class ArrayMap extends AMap implements IFn, IMap {
    private $zera$array: any[];

    constructor(meta: MetaData | null, array: any[] = []) {
        super(meta);
        this.$zera$array = array;
        if (this.$zera$array.length % 2 !== 0)
            throw new Error("Maps should have an even number of entries");
    }

    static EMPTY = new ArrayMap(null, []);

    static createFromEntries(entries: any[]): ArrayMap {
        var i,
            e,
            a = [];
        for (i = 0; i < entries.length; i++) {
            e = entries[i];
            if (isMapEntry(e)) {
                a.push(e.key());
                a.push(e.val());
            } else if (isArray(e) && e.length === 2) {
                a.push(e[i]);
                a.push(e[i + 1]);
            } else {
                throw new Error("Invalid map entry");
            }
        }

        return new ArrayMap(null, a);
    }

    count() {
        return this.$zera$array.length / 2;
    }

    withMeta(meta: MetaData): ArrayMap {
        return new ArrayMap(meta, this.$zera$array);
    }

    toString(): string {
        var buff = [],
            i;
        var array = this.$zera$array;
        for (i = 0; i < array.length; i += 2) {
            buff.push(str(prnStr(array[i]), " ", prnStr(array[i + 1])));
        }
        return str("{", buff.join(", "), "}");
    }

    conj(entries: any[]): ArrayMap {
        var i,
            x,
            array = this.$zera$array,
            a = [];
        for (i = 0; i < array.length; i++) {
            a.push(array[i]);
        }
        for (i = 0; i < entries.length; i++) {
            x = mapEntry(entries[i]);
            a.push(x.key());
            a.push(x.val());
        }
        return new ArrayMap(this.meta(), a);
    };

    entries(): PersistentList {
        var array = this.$zera$array;
        var i;
        var res = [];
        for (i = 0; i < array.length; i += 2) {
            res.push(new MapEntry(array[i], array[i + 1]));
        }
        return list.apply(null, res);
    }

    seq(): PersistentList {
        this.entries();
    }

    keys(): PersistentList {
        var entries = this.$zera$array;
        var i;
        var res = [];
        for (i = 0; i < entries.length; i += 2) {
            res.push(entries[i]);
        }
        return list.apply(null, res);
    }

    vals(): PersistentList {
        var entries = this.$zera$array;
        var i;
        var res = [];
        for (i = 0; i < entries.length; i += 2) {
            res.push(entries[i + 1]);
        }
        return list.apply(null, res);
    }

    find(key: any): any {
        var val,
            i,
            entries = this.$zera$array;
        for (i = 0; i < entries.length; i += 2) {
            if (equals(entries[i], key)) {
                val = entries[i + 1];
                return val;
            }
        }
        return null;
    }

    apply(_: any, args: any[]): any {
        return this.invoke.apply(this, args);
    }

    call(_: any, ...args: any[]): any {
        return this.invoke.apply(this, args);
    }

    invoke(...args: any[]): any {
        return this.find(args[0]);
    }

    assoc(...pairs: any[]): ArrayMap {
        var i;
        if (pairs.length % 2 !== 0)
            throw new Error("key value pairs must be even to assoc");
        var entries = Array.prototype.slice.call(this.$zera$array);
        for (i = 0; i < pairs.length; i += 2) {
            entries.push(pairs[i]);
            entries.push(pairs[i + 1]);
        }
        return new ArrayMap(null, entries);
    }

    dissoc(key: any): ArrayMap {
        var i,
            newArray = [],
            array = this.$zera$array;
        for (i = 0; i < array.length; i += 2) {
            if (!equals(array[i], key)) {
                newArray.push(array[i]);
                newArray.push(array[i + 1]);
            }
        }
        return new ArrayMap(this.meta(), newArray);
    }

    containsKey(key: any): boolean {
        var i,
            array = this.$zera$array;
        for (i = 0; i < array.length; i += 2) {
            if (equals(array[i], key)) return true;
        }
        return false;
    }

    // Equals
    equals(other: any): boolean {
        var a, i, key, val;
        if (!isArrayMap(other)) {
            return false;
        } else if (this.count() !== other.count()) {
            return false;
        } else {
            a = this.$zera$array;
            for (i = 0; i < a.length; i += 2) {
                key = a[i];
                val = a[i + 1];
                if (!equals(val, other.find(key))) return false;
            }
            return true;
        }
    }
}

export function isArrayMap(x: any): boolean {
    return x instanceof ArrayMap;
}

export function arrayMap(...pairs: any[]) {
    return new ArrayMap(null, pairs);
}
