import { zeraProtocol } from "../types";

export interface IMeta {
    meta(): any;
}

export type MetaData = any;

@zeraProtocol('zera.lang.AMeta')
export class AMeta implements IMeta {
    protected $zera$meta: MetaData;

    constructor(meta: MetaData) {
        this.$zera$meta = meta;
    }

    meta() {
        return this.$zera$meta;
    }
}

export function meta(x: any): MetaData {
    if (x == null) return null;
    else if (x instanceof AMeta) {
        return x.meta();
    } else {
        throw new Error(`Don't now how to get metadata from: ${x}`);
    }
}
