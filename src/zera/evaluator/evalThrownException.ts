
export function evalThrownException(form, env) {
    var exp = evaluate(car(cdr(form)), env);
    throw exp;
}
