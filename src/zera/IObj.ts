import { IMeta } from "./IMeta"
import { isJSFn } from "./core"

export class IObj extends IMeta {
    $zera$isProtocol: true;
    $zera$tag: "zera.lang.IObj";
    $zera$protocols: { "zera.lang.IMeta": IMeta };

    withMeta(meta: any): IObj {
        throw new Error(`withMeta is not implemented for ${this}`);
    }
}

function withMeta(x: any, meta: any): IObj {
    if (x == null) return null;
    else if (isJSFn(x.withMeta)) {
        return x.withMeta(meta);
    } else {
        throw new Error("Don't now how to add metadata to: " + x);
    }
}
