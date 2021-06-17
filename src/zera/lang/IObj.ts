import { IMeta, AMeta, MetaData } from "./IMeta"
import { isJSFn } from "../runtime"
import { zeraProtocol } from "../types";

export interface IObj extends IMeta {
    withMeta(meta: MetaData): IObj
}

@zeraProtocol('zera.lang.AObj', AMeta)
export class AObj extends AMeta {
    withMeta(meta: MetaData): IObj {
        throw new Error(`withMeta is not implemented for ${this}`);
    }
}

export function withMeta(x: any, meta: any): any {
    if (x == null) {
        return null;
    }
    else if (meta == null) {
        return x;
    }
    else if (isJSFn(x.withMeta)) {
        return x.withMeta(meta);
    } else {
        throw new Error("Don't now how to add metadata to: " + x);
    }
}
