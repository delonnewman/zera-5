import { AReference, IReference } from "./AReference";
import { zeraProtocol } from "../types";
import { arrayMap, ArrayMap } from "./ArrayMap";
import { Applicable, apply, list, isEmpty } from "../core";
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

    // TODO: complete ARef implementation
    protected processWatchers(old: any, knew: any): void {
        var s,
            f,
            watchers = this.$zera$watchers;
        if (isEmpty(watchers)) return;
        for (s = watchers.entries(); s != null; s = s.next()) {
            var kv = s.first();
            f = kv.val();
            if (f != null) apply(f, list(kv.key(), this, old, knew));
            else {
                throw new Error("A watcher must be a function of 4 arguments");
            }
        }
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
