import { Env, evaluate, env } from "./index"
import { calculateArity, Fn, isVector, prnStr, first, rest, car, cdr, isList, mapA, str } from "../runtime"


// TODO: add destructuring
// TODO: add variable validation, capture variable values from environment
// TODO: add recur support
// (fn ([x] x)
//     ([x & xs] (cons x xs)))
export function evalFunction(form: any, env_: Env, isMethod = false): Fn {
    var xs = cdr(form),
        names = car(xs),
        body = cdr(xs);
    if (isList(names)) {
        var arglists = mapA(first, xs),
            bodies = mapA(rest, xs),
            arglists_ = {},
            bodies_ = {};
        for (var i = 0; i < arglists.length; i++) {
            if (!isVector(arglists[i])) {
                throw new Error(
                    "A multi-body function should have a body of lists where the first element is a vector, got: " +
                    prnStr(form)
                );
            }
            var arglist = arglists[i].toArray();
            var arity = calculateArity(arglist);
            arglists_[arity] = arglist;
            bodies_[arity] = bodies[i];
        }
        return new Fn(form.meta(), env(env_), arglists_, bodies_, isMethod);
    } else if (isVector(names)) {
        return new Fn(
            form.meta(),
            env(env_),
            [names.toArray()],
            [body],
            isMethod
        );
    }
    throw new Error(
        str(
            "function arguments should be a vector or a list of vectors, got: ",
            prnStr(form)
        )
    );
}
