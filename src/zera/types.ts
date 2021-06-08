import { prnStr, str } from "./core";

export type ZeraObject = {
    $zera$protocols: object;
}

export class ZeraType extends Function {
    $zera$tag: string;
    $zera$isProtocol?: false;
    $zera$isType: true;
}

export class ZeraProtocol extends Function {
    $zera$tag: string;
    $zera$isProtocol: true;
    $zera$isType?: false;
}

export type ZeraTypelike = ZeraType | ZeraProtocol;

export function isa(child: ZeraObject, parent: ZeraTypelike) {
    if (child == null) return false;
    if (child instanceof parent) return true;
    var protocols = child.$zera$protocols;
    if (protocols == null) return false;
    return parent === protocols[parent.$zera$tag];
}

export function isProtocol(obj: any): boolean {
    return obj.$zera$isProtocol === true;
}

export function isType(obj: any): boolean {
    return obj.$zera$isType === true;
}

export function initWithProtocols(obj: ZeraObject, ...protocols: Array<ZeraProtocol>) {
    var i = 0, protocol: ZeraProtocol;
    for (; i < protocols.length; i++) {
        protocol = protocols[i];
        if (!isProtocol(protocol))
            throw new Error(
                str(prnStr(protocol), " is not a valid protocol")
            );
        protocol.call(obj);
    }
}

export function extend(obj: object, other: object): object {
    var keys = Object.keys(other);
    var i = 0, k: string;
    for (; i < keys.length; i++) {
        k = keys[i];
        obj[k] = other[k];
    }
    return obj;
}

export function extendWithProtocols(ctr: ZeraType, ...protocols: Array<ZeraProtocol>): ZeraType {
    var i = 0, protocol: ZeraProtocol;
    for (; i < protocols.length; i++) {
        protocol = protocols[i];
        if (!isProtocol(protocol))
            throw new Error(
                str(prnStr(protocol), " is not a valid protocol")
            );
        ctr.prototype = extend(ctr.prototype, protocol.prototype);
    }
    return ctr;
}
