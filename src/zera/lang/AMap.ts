import { zeraProtocol } from "../types";
import { ISeq, Seq } from "./Seq";
import { prnStr, str, isJSFn } from "../core";

export interface IMap {
    entries(): any[];
    find(key: any): any;
    assoc(key: any, value: any): IMap;
    dissoc(key: any): IMap;
    keys(): any[];
    vals(): any[];
    containsKey(key: any): boolean;
}

@zeraProtocol('zera.lang.AMap', Seq)
export class AMap extends Seq implements ISeq, IMap {
    entries(): any[] {
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

    keys(): any[] {
        throw new Error('unimplemented');
    }

    vals(): any[] {
        throw new Error('unimplemented');
    }

    containsKey(key: any): boolean {
        throw new Error('unimplemented');
    }
}

export type Map = { has: (key: any) => any };
export type Maplike = IMap | Map;

export function isMap(x: any): boolean {
    return (
        x instanceof AMap ||
        Object.prototype.toString.call(x) === "[object Map]"
    );
}

export function isAMap(x: any): boolean {
    return x instanceof AMap;
}

export function entries(m: IMap): any[] {
    if (isJSFn(m.entries)) return m.entries();
    else {
        throw new Error(
            str("Don't know how to get the entries of: ", prnStr(m))
        );
    }
}

export function find(m: IMap, key: any): any {
    if (isJSFn(m.find)) {
        return m.find(key);
    } else {
        throw new Error(
            str("Don't know how to find value by key in: ", prnStr(m))
        );
    }
}

export function get(m: IMap, key: any, alt: any = null): any {
    if (isJSFn(m.find)) {
        var val = m.find(key);
        if (alt == null) {
            return val ? val : null;
        } else {
            return val ? val : alt;
        }
    } else {
        throw new Error(
            str("Don't know how to get value by key from: ", prnStr(m))
        );
    }
}

// TODO: add variable number of key-value pairs
export function assoc(m: IMap, key: any, value: any): IMap {
    if (isJSFn(m.assoc)) {
        return m.assoc(key, value);
    } else {
        throw new Error(str("Don't know how to assoc: ", prnStr(m)));
    }
}

// TODO: add variable number of keys
export function dissoc(m: IMap, k: any): IMap {
    if (isJSFn(m.dissoc)) {
        return m.dissoc(k);
    } else {
        throw new Error(str("Don't know how to dissoc: ", prnStr(m)));
    }
}

export function keys(m: IMap): any[] {
    if (isJSFn(m.keys)) {
        return m.keys();
    } else {
        throw new Error(
            str("Don't know how to get keys from: ", prnStr(m))
        );
    }
}

export function vals(m: IMap): any[] {
    if (isJSFn(m.vals)) {
        return m.vals();
    } else {
        throw new Error(
            str("Don't know how to get vals from: ", prnStr(m))
        );
    }
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
