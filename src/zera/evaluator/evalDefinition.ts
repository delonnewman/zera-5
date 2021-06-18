import { CURRENT_NS, first, rest, str, symbol, Var } from "../runtime"
import { evaluate, Env } from "./index"

export function evalDefinition(form: any, env: Env): Var {
    var rest: any = rest(form);
    var name = first(rest);
    var value = first(rest(rest));
    var ns = CURRENT_NS.get();
    if (name.isQualified()) {
        if (name.namespace() !== str(ns.name())) {
            throw new Error(
                "Cannot define var in a namespace other than the current namespace"
            );
        }
        name = symbol(name.name());
    }
    return Var.intern(ns, name, evaluate(value, env));
}
