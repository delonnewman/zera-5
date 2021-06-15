import { ARef } from "./ARef";
import { zeraType } from "../types";
import { MetaData } from "./IMeta";
import { Namespace } from "./Namespace";
import { Symbol } from "./Symbol";
import { Keyword } from "./Keyword";
import { arrayMap } from "./ArrayMap";

const KW_DYNAMIC = Keyword.intern(Symbol.intern("dynamic"));

// TODO: complete Var implementation
@zeraType('zera.lang.Var', ARef)
export class Var extends ARef {
    private $zera$ns: string;
    private $zera$name: string;

    constructor(meta: MetaData, namespace: string, name: string) {
        super(meta, null, null);
        this.$zera$ns = namespace;
        this.$zera$name = name;
    }

    static intern(ns: Namespace | Symbol | string, sym: Symbol, init: any): Var {
        var ns_ = isNamespace(ns) ? ns : Namespace.findOrCreate(ns);
        var v = ns_.intern(sym);
        if (init != null) v.set(init);
        v.resetMeta(sym.meta() || arrayMap());
        return v;
    }

    get() {
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

    setDynamic() {
        if (this.$zera$meta == null) {
            this.$zera$meta = arrayMap();
        }
        this.$zera$meta = this.$zera$meta.assoc(KW_DYNAMIC, true);
        return this;
    }

    isDynamic() {
        if (this.$zera$meta == null) return false;

        return !!this.$zera$meta.find(KW_DYNAMIC);
    }

    setMacro() {
        this.$zera$meta = this.$zera$meta.assoc([
            Keyword.intern("macro"),
            true,
        ]);
        return this;
    }

    Var.prototype.isMacro = function() {
        return !!this.$zera$meta.find(Keyword.intern("macro"));
    };

    Var.prototype.toString = function() {
        return str("#'", this.$zera$ns.name(), "/", this.$zera$name);
    };

function define(ns, name, init) {
    return Var.intern(ns, Sym.intern(name), init);
}

function isVar(x) {
    return x instanceof Var;
}

function varGet(v) {
    if (isVar(v)) return v.get();
    throw new Error("var-get can only be used on Vars");
}

function varSet(v, value) {
    if (isVar(v)) return v.set(value);
    throw new Error("var-set can only be used on Vars");
}
