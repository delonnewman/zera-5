import { IMeta } from "./IMeta";
import { apply, cons, isJSFn } from "./core";
import { zeraProtocol } from "./types";


@zeraProtocol('zera.lang.AReference')
class AReference extends IMeta {
    static $zera$protocols: { "zera.lang.IMeta": IMeta };

    $zera$meta: any;

    constructor(meta) {
        this.$zera$meta = meta;
    }

    meta(): any {
        return this.$zera$meta;
    }

    alterMeta(f, args) {
        this.$zera$meta = apply(f, cons(this.$zera$meta, args));
        return this.$zera$meta;
    }

    resetMeta(m: any) {
        this.$zera$meta = m;
        return this.$zera$meta;
    }
}

export function alterMeta(x: AReference, f: Function, args: any) {
    if (x == null) return null;
    else if (isJSFn(x.alterMeta)) {
        return x.alterMeta(f, args);
    } else {
        throw new Error("Don't now how to add alter metadata for: " + x);
    }
}

export function resetMeta(x: AReference, newM: any) {
    if (x == null) return null;
    else if (isJSFn(x.resetMeta)) {
        return x.resetMeta(newM);
    } else {
        throw new Error("Don't now how to reset metadata for: " + x);
    }
}
