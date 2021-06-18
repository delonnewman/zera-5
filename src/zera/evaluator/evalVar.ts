
export function evalVar(form, env) {
    var exp = car(cdr(form));
    if (!isSymbol(exp))
        throw new Error("Var name should be a Symbol, got: " + prnStr(exp));
    if (!exp.namespace())
        throw new Error("Var name should be fully qualified");
    var ns = Namespace.findOrDie(exp.namespace());
    return ns.findInternedVar(exp.name());
}
