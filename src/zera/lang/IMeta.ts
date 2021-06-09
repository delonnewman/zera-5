import { zeraProtocol } from "../types";

export interface IMeta {
    meta(): any;
}

@zeraProtocol('zera.lang.AMeta')
export class AMeta implements IMeta {
    private $zera$meta;

    constructor(meta: any) {
        this.$zera$meta = meta;
    }

    meta() {
        return this.$zera$meta;
    }
}

export function meta(x: any): any {
    if (x == null) return null;
    else if (x instanceof AMeta) {
        return x.meta();
    } else {
        throw new Error(`Don't now how to get metadata from: ${x}`);
    }
}
