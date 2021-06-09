import { prnStr, str } from "./core";

export type ZeraObject = {
    $zera$protocols: object;
}

export interface ZeraTypelike extends Function {
    $zera$tag: string;
    $zera$protocols?: ZeraProtocolMap;
}

export interface ZeraType extends ZeraTypelike {
    $zera$isType: true;
    $zera$isProtocol?: false;
}

export interface ZeraProtocol extends ZeraTypelike {
    $zera$isProtocol: true;
    $zera$isType?: true;
}

export type ZeraProtocolMap = {
    [key: string]: any;
};

// function ZeraType(name, fields, protocols) {
//     this.$zera$typeName = name;
//     this.$zera$fields = fields;
//     this.$zera$protocols = protocols;
// }

// ZeraType.prototype.class = function() {
//     return evaluate(this.$zera$typeName);
// };

// ZeraType.prototype.toString = function() {
//     var fields = this.$zera$fields;
//     var self = this;
//     return str(
//         "#<",
//         this.$zera$typeName,
//         " ",
//         join(
//             map(function(f) {
//                 return str(f, ": ", self[f]);
//             }, fields),
//             ", "
//         ),
//         ">"
//     );
// };


function protocolMap(protocols: any[]) {
    let map: ZeraProtocolMap = {};
    return protocols.reduce((mapping, proto) => {
        mapping[proto.$zera$tag] = proto;
        return mapping;
    }, map);
}

// handle the common aspects of the zeraProtocol and zeraType decorators
function typeTagger(tag: string, protocols: any[], f: Function) {
    return function(target: any) {
        f.call(target);
        target.$zera$protocols = protocolMap(protocols);
        target.$zera$tag = tag;
        return target;
    }
}

// protocol decorator
export function zeraProtocol(tag: string, ...protocols: any[]): Function {
    return typeTagger(tag, protocols, (target: any) => {
        target.$zera$isProtocol = true;
    })
}

// type decorator
export function zeraType(tag: string, ...protocols: any[]): Function {
    return typeTagger(tag, protocols, (target: any) => {
        target.$zera$isType = true;
    });
}

export function isa(child: ZeraObject, parent: ZeraTypelike) {
    if (child == null) return false;
    if (child instanceof parent) return true;
    var protocols: ZeraProtocolMap = child.$zera$protocols;
    if (protocols == null) return false;
    return parent === protocols[parent.$zera$tag];
}

export function isProtocol(obj: any): boolean {
    return obj.$zera$isProtocol === true;
}

export function isType(obj: any): boolean {
    return obj.$zera$isType === true;
}

export function initWithProtocols(obj: any, ...protocols: any[]) {
    var i = 0, protocol;
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

export function extendWithProtocols(ctr: Function, ...protocols: any[]): Function {
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
