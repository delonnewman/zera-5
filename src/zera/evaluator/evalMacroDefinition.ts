import { cdr, car, cons, arrayMap, keyword, Var, FN_SYM, CURRENT_NS } from "../runtime"
import { evalFunction } from "./evalFunction"
import { Env } from "./index"

export function evalMacroDefinition(form: any, env: Env): Var {
    var rest = cdr(form),
        name = car(rest),
        fnrest = cdr(rest),
        form_ = cons(FN_SYM, fnrest).withMeta(
            arrayMap(keyword("macro"), true)
        );
    var val = evalFunction(form_, env);
    return Var.intern(CURRENT_NS.get(), name, val).setMacro();
}
