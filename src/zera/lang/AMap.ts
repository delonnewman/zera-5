import { zeraProtocol } from "../types";
import { ISeq, Seq } from "./Seq";
import { prnStr, str, isJSFn } from "../core";

export interface IMap {
    entries(): ISeq;
    find(key: any): any;
    assoc(key: any, value: any): IMap;
    dissoc(key: any): IMap;
    keys(): ISeq;
    vals(): ISeq;
    containsKey(key: any): boolean;
}

@zeraProtocol('zera.lang.AMap', Seq)
export class AMap extends Seq implements ISeq, IMap {
    entries(): ISeq {
        throw new Error('unimplemented');
    }

    find(key: any): any {
        throw new Error('unimplemented');
    }

    assoc(key: any, value: any): any {
        throw new Error('unimplemented');
    }

    dissoc(key: any): any {
        throw new Error('unimplemented');
    }

    keys(): ISeq {
        throw new Error('unimplemented');
    }

    vals(): ISeq {
        throw new Error('unimplemented');
    }

    containsKey(key: any): boolean {
        throw new Error('unimplemented');
    }
}

export type JSMap = { has: (key: any) => any };
export type Maplike = IMap | JSMap;

export function isMap(x: any): boolean {
    return (
        x instanceof AMap ||
        Object.prototype.toString.call(x) === "[object Map]"
    );
}

export function isAMap(x: any): boolean {
    return x instanceof AMap;
}

export function entries(m: IMap): ISeq {
    return m.entries();
}

export function find(m: IMap, key: any): any {
    return m.find(key);
}

export function get(m: IMap, key: any, alt: any = null): any {
    var val = m.find(key);
    if (alt == null) {
        return val ? val : null;
    } else {
        return val ? val : alt;
    }
}

// TODO: add variable number of key-value pairs
export function assoc(m: IMap, key: any, value: any): IMap {
    return m.assoc(key, value);
}

// TODO: add variable number of keys
export function dissoc(m: IMap, k: any): IMap {
    return m.dissoc(k);
}

export function keys(m: IMap): ISeq {
    return m.keys();
}

export function vals(m: IMap): ISeq {
    return m.vals();
}

export function containsKey(m: any, k: any): boolean {
    if (m.containsKey) {
        return m.containsKey(k);
    } else if (isJSFn(m.has)) {
        return m.has(k);
    } else {
        throw new Error(str("Not a valid map"));
    }
}

export function contains(col: any, k: any) {
    if (isAMap(col)) {
        return col.containsKey(k);
    } else if (isJSFn(col.contains)) {
        return col.contains(k);
    } else if (isJSFn(col.has)) {
        return col.has(k);
    } else {
        throw new Error(
            str(prnStr(col), " is not an associative collection")
        );
    }
}
