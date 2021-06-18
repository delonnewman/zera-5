import { CURRENT_NS, ZERA_NS, Namespace, str, prn, Symbol, symbol } from "../runtime"
import { lookup, Env } from "./Env"

// Algorithm:
// 1) if namespace-qualified lookup in namespace
// 2) lookup in lexical scope
// 3) lookup in current namespace
// 4) lookup in default namespace
// (could go back and put default imports in top then they'll
// always be found lexically unless they've been redefined and should be more performant)
export function evalSymbol(sym: Symbol, env: Env) {
    var MACRO_ERROR = str("Macros cannot be evaluated in this context");
    var name = sym.name();

    // 1) namespace-qualified
    if (sym.isQualified()) {
        let ns = CURRENT_NS.get().lookupAlias(sym.namespace());
        ns = ns == null ? Namespace.findOrDie(sym.namespace()) : ns;

        let v = ns.mapping(name);

        if (!v) throw new Error(str("Undefined variable: ", sym));
        if (v.isMacro()) throw new Error(MACRO_ERROR);

        return v.get();
    } else {
        // 2) lookup in lexical environment
        let scope = lookup(env, name);

        if (scope != null) {
            return scope.vars[name];
        } else {
            // 3) lookup in scoped namespace
            let ns = env.vars["*ns*"];
            let v = ns && ns.mapping(symbol(name));

            if (v) {
                if (v.isMacro()) {
                    prn(v);
                    throw new Error(MACRO_ERROR);
                }
                return v.get();
            } else {
                // 4) lookup in current namespace
                v = CURRENT_NS.get().mapping(symbol(name));
                if (v) {
                    if (v.isMacro()) {
                        prn(v);
                        throw new Error(MACRO_ERROR);
                    }
                    return v.get();
                } else {
                    // 5) lookup in default namespace
                    v = ZERA_NS.mapping(symbol(name));
                    if (v) {
                        if (v.isMacro()) throw new Error(MACRO_ERROR);
                        return v.get();
                    }
                    throw new Error(str("Undefined variable: ", sym));
                }
            }
        }
    }
}
