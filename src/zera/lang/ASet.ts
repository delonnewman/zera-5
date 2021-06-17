import { IObj, AObj } from "./index";
import { zeraProtocol } from "../types";

@zeraProtocol('zera.lang.ASet', AObj)
export class ASet extends AObj implements IObj { }

export function isSet(x: any): boolean {
    return x instanceof ASet || Object.prototype.toString.call(x) === '[object Set]';
}
