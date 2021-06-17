import { zeraProtocol } from "../types"
import { IObj, AObj } from "./index"

export interface IInvoke {
    invoke(...args: any[]): any;
}

export interface IApplicable {
    apply(_: any, args: any[]): any;
}

export interface ICallable {
    call(_: any, ...args: any[]): any;
}

export interface IJSFunction extends ICallable, IApplicable { }

@zeraProtocol('zera.lang.AInvoke', AObj)
export class AInvoke extends AObj implements IInvoke, IObj {
    invoke() {
        throw new Error("unimplemented");
    }
}

export interface IFn extends IInvoke, IJSFunction { }

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
