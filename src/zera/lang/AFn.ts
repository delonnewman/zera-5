import { zeraProtocol } from "../types"
import { IObj, AObj } from "./IObj"
import { Seq } from "./Seq"
import { isArray, first, intoArray, prnStr } from "../core"

export interface IInvoke {
    invoke(...args: any[]): any;
}

@zeraProtocol('zera.lang.AInvoke', AObj)
export class AInvoke extends AObj implements IInvoke, IObj {
    invoke() {
        throw new Error("unimplemented");
    }
}

export interface IFn extends IInvoke {
    call(_: any, ...args: any[]): any;
    apply(_: any, args: any[]): any;
}

@zeraProtocol('zera.lang.AFn', AInvoke)
export class AFn extends AInvoke implements IFn, IObj {
    call(_: any, ...args: any) {
        return this.invoke.apply(this, args);
    }

    apply(_: any, args: any) {
        return this.invoke.apply(this, args);
    }
}

export function isFn(fn: any): boolean {
    return fn instanceof AFn;
}

export function isInvokable(x: any): boolean {
    return x instanceof AInvoke;
}

export function apply(fn: any, args: Seq): any {
    if (isArray(fn)) return fn[first(args)];
    if (isInvokable(fn)) {
        return fn.apply(null, intoArray(args));
    } else {
        throw new Error(`Not a valid function: ${prnStr(fn)}`);
    }
}
