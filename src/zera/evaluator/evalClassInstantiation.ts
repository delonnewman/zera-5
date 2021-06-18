
export function evalClassInstantiation(form, env) {
    var ctr = evaluate(car(cdr(form)), env);
    if (ctr.$zera$isProtocol === true)
        throw new Error("Protocols cannot be instantiated");
    if (!isJSFn(ctr))
        throw new Error("class given is not a valid constructor");
    var args = mapA(function(x) {
        return evaluate(x, env);
    }, cdr(cdr(form)));
    return new (ctr.bind.apply(ctr, [].concat(ctr, args)))();
}
