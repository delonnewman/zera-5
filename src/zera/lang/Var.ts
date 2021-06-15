import { ARef } from "./ARef";
import { MetaData } from "./IMeta";
import { Namespace, isNamespace } from "./Namespace";
import { Symbol } from "./Symbol";
import { Keyword } from "./Keyword";
import { arrayMap } from "./ArrayMap";
import { zeraType } from "../types";
import { str } from "../core";

const KW_DYNAMIC = Keyword.intern(Symbol.intern("dynamic"));
const KW_MACRO = Keyword.intern(Symbol.intern("macro"));

// TODO: complete Var implementation
@zeraType('zera.lang.Var', ARef)
export class Var extends ARef {
    private $zera$ns: Namespace;
    private $zera$name: Symbol;

    constructor(meta: MetaData | null, namespace: Namespace, name: Symbol) {
        super(meta, null, null);
        this.$zera$ns = namespace;
        this.$zera$name = name;
    }

    static intern(ns: any, sym: Symbol, init: any): Var {
        var ns_: Namespace = isNamespace(ns) ? ns : Namespace.findOrCreate(ns);
        var v = ns_.intern(sym);
        if (init != null) v.set(init);
        v.resetMeta(sym.meta() || arrayMap());
        return v;
    }

    get(): any {
        return this.$zera$value;
    }

    set(value: any): any {
        this.validate(value);
        if (this.$zera$value == null || this.isDynamic()) {
            var old = this.$zera$value;
            this.$zera$value = value;
            this.processWatchers(old, value);
            return value;
        } else {
            throw new Error("Can't set Var value once it has been set");
        }
    }

    setDynamic(): Var {
        if (this.$zera$meta == null) {
            this.$zera$meta = arrayMap();
        }
        this.$zera$meta = this.$zera$meta.assoc(KW_DYNAMIC, true);
        return this;
    }

    isDynamic(): boolean {
        if (this.$zera$meta == null) return false;

        return !!this.$zera$meta.find(KW_DYNAMIC);
    }

    setMacro(): Var {
        if (this.$zera$meta == null) {
            this.$zera$meta = arrayMap();
        }

        this.$zera$meta = this.$zera$meta.assoc(KW_MACRO, true);
        return this;
    }

    isMacro(): boolean {
        if (this.$zera$meta == null) return false;

        return !!this.$zera$meta.find(KW_MACRO);
    }

    toString() {
        return str("#'", this.$zera$ns.name(), "/", this.$zera$name);
    }
}

export function define(ns: Namespace | Symbol | string, name: string, init: any): Var {
    return Var.intern(ns, Symbol.intern(name), init);
}

export function isVar(x: any): boolean {
    return x instanceof Var;
}

export function varGet(v: Var): any {
    return v.get();
}

export function varSet(v: Var, value: any): Var {
    return v.set(value);
}
