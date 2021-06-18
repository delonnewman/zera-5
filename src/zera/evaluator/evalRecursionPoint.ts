
export function evalRecursionPoint(form, env) {
    var args = mapA(function(x) {
        return evaluate(x, env);
    }, cdr(form));
    throw new RecursionPoint(args);
}
