import { isa, ZeraProtocol } from "./types";

export class IMeta extends ZeraProtocol {
    static $zera$tag: 'zera.lang.IMeta';
    static $zera$isProtocol: true;

    meta(): any {
        throw new Error(`meta is not implemented in ${this}`);
    }
}

export function meta(x: any): any {
    if (x == null) return null;
    else if (isa(x, IMeta)) {
        return x.meta();
    } else {
        throw new Error("Don't now how to get metadata from: " + x);
    }
}
