import {
    symbol,
    isList,
    isSymbol,
    first,
    rest,
    next,
    apply,
    list,
    cons,
    conj,
    Vector,
    SPECIAL_FORMS,
    DOT_SYM,
    NEW_SYM
} from "../runtime";

import { Env, env, defineLexically } from "./Env";
import { findVar } from "./findVar";

const AMP_FORM = symbol("&form");
const AMP_ENV = symbol("&env");

function isTaggedValue(x: any): boolean {
    return isList(x) && isSymbol(first(x));
}

// TODO: set &form and &env in macro scope
export function macroexpand(form: any, env_: Env, stack: Vector): any {
    var stack_;
    if (isTaggedValue(form)) {
        var sym = first(form);
        stack_ = conj(stack, sym);
        var name = sym.toString();

        if (SPECIAL_FORMS[name]) {
            return form;
        }
        else if (name !== ".-" && name.startsWith(".-")) {
            return list(".", first(rest(form)), symbol(name.slice(1)));
        }
        else if (name !== "." && name.startsWith(".")) {
            return list(
                DOT_SYM,
                first(rest(form)),
                cons(symbol(name.slice(1)), rest(rest(form)))
            );
        } else if (name.endsWith(".")) {
            return cons(
                NEW_SYM,
                cons(symbol(name.replace(/\.$/, "")), rest(form))
            );
        }
        else {
            var v = findVar(sym, true); // will return null on error rather than throw an exception
            if (v == null) return form;
            if (v.isMacro()) {
                var scope = env(env_);
                defineLexically(scope, AMP_ENV, scope);
                defineLexically(scope, AMP_FORM, form);

                return macroexpand(
                    apply(v.get(), next(form)),
                    scope,
                    stack_
                );
            } else {
                return form;
            }
        }
    }
    return form;
}
