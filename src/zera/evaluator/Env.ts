import { CURRENT_NS, Var } from "../runtime";

export type Env = { vars: { [key: string]: Var | null }, parent: null | Env };

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
