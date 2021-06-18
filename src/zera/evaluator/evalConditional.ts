import { first, rest, count, prnStr, isNil } from "../runtime"
import { Env, evaluate } from "./index"

export function evalConditional(form: any, env: Env): any {
    var preds: any = rest(form);

    if (count(preds) % 2 !== 0) {
        throw new Error("cond requires an even number of predicates: " + prnStr(form));
    }

    var i = 1,
        x,
        y,
        rest_,
        xs = preds;
    while (i < count(preds)) {
        rest_ = rest(xs);
        x = first(xs);
        y = first(rest_);

        if (x === "else") {
            return evaluate(y, env);
        } else {
            x = evaluate(x, env);
            if (!isNil(x) && x !== false) {
                return evaluate(y, env);
            }
        }
        xs = rest(rest_);
        i++;
    }
    return null;
}
