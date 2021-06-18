import { first, rest } from "../runtime"
import { Env, evaluate, set } from "./index"

export function evalAssignment(form: any, env: Env): any {
    var rest: any = rest(form);
    var name = first(rest);
    var value = first(rest(rest));

    if (name == null || value == null)
        throw new Error("Malformed assignment expecting: (set! target value)");

    return set(env, name, evaluate(value, env));
}
