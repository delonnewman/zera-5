import { AReference, IReference } from "./AReference";
import { zeraProtocol } from "../types";
import { arrayMap, ArrayMap } from "./ArrayMap";
import { Applicable, apply, list } from "../core";
import { MetaData } from "./IMeta";

@zeraProtocol('zera.lang.ARef', AReference)
export class ARef extends AReference implements IReference {
    protected $zera$watchers: ArrayMap;
    protected $zera$validator: Applicable | null;
    protected $zera$value: any;

    constructor(meta: MetaData | null, value: any, validator: Applicable | null) {
        super(meta);
        this.$zera$watchers = arrayMap();
        this.$zera$validator = validator;
        this.$zera$value = value;
    }

    deref() {
        return this.$zera$value;
    }

    validate(value: any) {
        var v = this.$zera$validator;
        if (v == null) return null;
        if (!apply(v, list(value ? value : this.$zera$value)))
            throw new Error("Not a valid value for this reference");
    }

    addWatch(key: any, f: Applicable): ARef {
        this.$zera$watchers = this.$zera$watchers.assoc([key, f]);
        return this;
    }

    removeWatch(key: any): ARef {
        this.$zera$watchers = this.$zera$watchers.dissoc(key);
        return this;
    }

    setValidator(f: Applicable) {
        this.$zera$validator = f;
        return this;
    }
}

export function addWatch(ref: ARef, key: any, f: Applicable) {
    return ref.addWatch(key, f);
}

export function removeWatch(ref: ARef, key: any) {
    return ref.removeWatch(key);
}

export function setValidator(ref: ARef, f: Applicable) {
    return ref.setValidator(f);
}

export function deref(ref: ARef) {
    return ref.deref();
}
