import { CURRENT_NS, ZERA_NS, Symbol, symbol, Namespace } from "../runtime";

export type Env = { vars: { [key: string]: any }, parent: null | Env };

export function env(parent: null | Env = null): Env {
    if (parent) {
        return {
            vars: { "*ns*": parent.vars["*ns*"] || CURRENT_NS.get() },
            parent: parent,
        };
    } else {
        return {
            vars: {},
            parent: null,
        };
    }
}

export function lookup(env: Env, name: string): any {
    if (env == null) {
        return null;
    } else if (env.vars != null && env.vars[name] !== void 0) {
        return env;
    } else {
        if (env.parent == null) {
            return null;
        } else {
            var scope: Env | null = env.parent;
            while (scope != null) {
                if (scope.vars != null && scope.vars[name] !== void 0) {
                    return scope;
                }
                scope = scope.parent;
            }
            return null;
        }
    }
}

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

export function isEnv(x: any): boolean {
    return x != null && x.vars !== void 0;
}

export function defineLexically(env: Env, name: any, value: any): null {
    if (typeof value !== "undefined") {
        env.vars[name] = value;
        return null;
    } else {
        env.vars[name] = null;
        return null;
    }
}

export function set(env: Env, name: Symbol, value: any): any {
    if (!name.isQualified()) {
        var scope = lookup(env, name.toString());
        if (scope) {
            scope.vars[name.toString()] = value;
            return scope.vars[name.toString()];
        }
    }
    var v = findVar(name);
    return v.set(value);
}
