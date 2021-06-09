import { AObj } from "./IObj";
import { zeraProtocol } from "../types";
import { prnStr } from "../core";

export interface INamed {
    name(): string;
    namespace(): string;
}

@zeraProtocol('zera.lang.Named', AObj)
export class Named extends AObj implements INamed {
    name(): string {
        throw new Error("unimplemented");
    }

    namespace(): string {
        throw new Error("unimplemented");
    }
}

export function isNamed(x: any): boolean {
    return x instanceof Named;
}

export function name(named: INamed) {
    if (isNamed(named)) return named.name();
    else {
        throw new Error(`Don't know how to get the name of: ${prnStr(named)}`);
    }
}

export function namespace(named: INamed) {
    if (isNamed(named)) return named.namespace();
    else {
        throw new Error(`Don't know how to get the namespace of: ${prnStr(named)}`);
    }
}
