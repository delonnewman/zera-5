import { Symbol, symbol, CURRENT_NS, Namespace, ZERA_NS } from "../runtime";

export function findVar(sym: Symbol, returnNull: boolean = false) {
    var ERROR_UNDEFINED_VAR = new Error("Undefined variable: " + sym);
    var name = symbol(sym.name());

    if (sym.isQualified()) {
        let ns = CURRENT_NS.get().lookupAlias(sym.namespace());
        ns = ns == null ? Namespace.findOrDie(sym.namespace()) : ns;
        let v = ns.mapping(name);
        if (!v) {
            if (!returnNull) throw ERROR_UNDEFINED_VAR;
            return null;
        }
        return v;
    } else {
        let v = CURRENT_NS.get().mapping(name);
        if (v) return v;
        else {
            v = ZERA_NS.mapping(name);
            if (v) return v;
            if (returnNull) return null;
            throw ERROR_UNDEFINED_VAR;
        }
    }
}
