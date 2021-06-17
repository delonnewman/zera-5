import { zeraProtocol } from "../types";
import { AMeta, IMeta, MetaData, ISeq } from "./index";
import { apply, cons, isJSFn, Applicable } from "../runtime";

export interface IReference {
    alterMeta(f: Applicable, args: ISeq): MetaData | null;
    resetMeta(m: MetaData): MetaData;
}

@zeraProtocol('zera.lang.AReference', AMeta)
export class AReference extends AMeta implements IMeta, IReference {
    alterMeta(f: Applicable, args: ISeq): MetaData | null {
        this.$zera$meta = apply(f, cons(this.$zera$meta, args));
        return this.$zera$meta;
    }

    resetMeta(m: MetaData): MetaData {
        this.$zera$meta = m;
        return this.$zera$meta;
    }
}

export function alterMeta(x: AReference, f: Applicable, args: ISeq) {
    if (x == null) return null;
    else if (isJSFn(x.alterMeta)) {
        return x.alterMeta(f, args);
    } else {
        throw new Error("Don't now how to add alter metadata for: " + x);
    }
}

export function resetMeta(x: AReference, newM: MetaData) {
    if (x == null) return null;
    else if (isJSFn(x.resetMeta)) {
        return x.resetMeta(newM);
    } else {
        throw new Error("Don't now how to reset metadata for: " + x);
    }
}
