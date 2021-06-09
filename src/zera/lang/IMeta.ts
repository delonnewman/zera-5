import { zeraProtocol } from "../types";
import { IMap } from "./AMap";

export interface IMeta {
    meta(): any;
}

export type MetaData = IMap;

@zeraProtocol('zera.lang.AMeta')
export class AMeta implements IMeta {
    protected $zera$meta: MetaData | null;

    constructor(meta: MetaData | null) {
        this.$zera$meta = meta;
    }

    meta() {
        return this.$zera$meta;
    }
}

export function meta(x: any): MetaData | null {
    if (x == null) return null;
    else if (x instanceof AMeta) {
        return x.meta();
    } else {
        throw new Error(`Don't now how to get metadata from: ${x}`);
    }
}
