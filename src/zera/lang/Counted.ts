import { zeraProtocol } from "../types"

export interface ICounted {
    count(): number;
}

@zeraProtocol('zera.lang.Counted')
export class Counted implements ICounted {
    count(): number {
        throw new Error('unimplemented');
    }
}
