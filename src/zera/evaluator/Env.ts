import { CURRENT_NS, Var } from "../runtime";

export type Env = { vars: { [key: string]: Var }, parent: null | Env };

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

export function isEnv(x: any): boolean {
    return x != null && x.vars !== void 0;
}
