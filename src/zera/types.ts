export type ZeraObject = {
    $zera$protocols: object;
}

export class ZeraType extends Function {
    $zera$tag: string;
    $zera$isProtocol: boolean;
    $zera$isType: boolean;
}


export function isa(child: ZeraObject, parent: ZeraType) {
    if (child == null) return false;
    if (child instanceof parent) return true;
    var protocols = child.$zera$protocols;
    if (protocols == null) return false;
    return parent === protocols[parent.$zera$tag];
}

export function isProtocol(obj: ZeraType) {
    return obj.$zera$isProtocol === true;
}

export function isType(obj: ZeraType) {
    return obj.$zera$isType === true;
}

export function initWithProtocols(obj: ZeraObject) {
    var protocols = Array.prototype.slice.call(arguments, 1);
    if (protocols.length === 1 && isArray(protocols[0])) {
        protocols = protocols[0];
    }
    var i, protocol;
    for (i = 0; i < protocols.length; i++) {
        protocol = protocols[i];
        if (!isProtocol(protocol))
            throw new Error(
                str(prnStr(protocol), " is not a valid protocol")
            );
        protocol.call(obj);
    }
}

function extend(obj, other) {
    if (obj == null) var obj = Object.create(null);
    var keys = Object.keys(other);
    var i, k, v;
    for (i = 0; i < keys.length; i++) {
        k = keys[i];
        obj[k] = other[k];
    }
    return obj;
}

function extendWithProtocols(ctr: Function) {
    var protocols = Array.prototype.slice.call(arguments, 1);
    if (protocols.length === 1 && isArray(protocols[0])) {
        protocols = protocols[0];
    }
    var i, protocol;
    for (i = 0; i < protocols.length; i++) {
        protocol = protocols[i];
        if (!isProtocol(protocol))
            throw new Error(
                str(prnStr(protocol), " is not a valid protocol")
            );
        ctr.prototype = extend(ctr.prototype, protocol.prototype);
    }
    return ctr;
}
