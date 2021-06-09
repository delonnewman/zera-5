import { AObj, IObj } from "./IObj"
import { AMeta } from "./IMeta"
import { Named } from "./Named"
import { zeraType } from "../types"
import { isJSFn } from "../core"

@zeraType('zera.lang.Symbol', Named, AObj, AMeta)
export class Symbol extends Named {
    private $zera$ns: string | null;
    private $zera$name: string;
    private $zera$meta: any;

    constructor(ns: string | null, name: string, meta = {}) {
        super();
        this.$zera$ns = ns;
        this.$zera$name = name;
        this.$zera$meta = meta;
    }

    static intern(rep: string): Symbol {
        var i = rep.indexOf("/");
        if (i === -1 || rep === "/") {
            return new Symbol(null, rep);
        } else {
            return new Symbol(rep.substring(0, i), rep.substring(i + 1));
        }
    }

    name(): string {
        return this.$zera$name;
    }

    namespace(): string | null {
        return this.$zera$ns;
    }

    toString(): string {
        if (this.$zera$ns == null) {
            return this.$zera$name;
        }
        return `${this.$zera$ns}/${this.$zera$name}`;
    }

    isQualified(): boolean {
        return !!this.$zera$ns;
    }

    // IObj
    withMeta(meta: any): IObj {
        return new Symbol(this.$zera$ns, this.$zera$name, meta);
    }

    // IObj, IMeta
    meta(): any {
        return this.$zera$meta;
    }

    // Invokable
    apply(_: null, args: any[]) {
        if (args.length != 1)
            throw new Error("Symbols expect one and only one argument");

        if (isJSFn(args[0].apply)) {
            return args[0].apply(null, [this]);
        } else {
            throw new Error("Symbols expect and argument this is invokable");
        }
    }

    equals(o: any) {
        if (o == null || !isSymbol(o)) return false;
        return this.$zera$ns === o.$zera$ns && this.$zera$name === o.$zera$name;
    }
}

export function symbol(...args: string[]) {
    if (args.length === 1) {
        return new Symbol(null, args[0]);
    } else if (arguments.length === 2) {
        return new Symbol(args[0], args[1]);
    } else {
        throw new Error(`Wrong number of arguments (${arguments.length}) passed to symbol`);
    }
}

export function isSymbol(x: any): boolean {
    return x instanceof Symbol;
}
