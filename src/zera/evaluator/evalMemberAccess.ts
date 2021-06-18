
// member access
// (. obj member)
// (. obj symbol)
// (. obj -symbol)
// (. obj (symbol *args))
// (. obj (-symbol))
export function evalMemberAccess(form, env) {
    var obj = evaluate(car(cdr(form)), env);
    var member = car(cdr(cdr(form)));
    var val;
    if (isSymbol(member)) {
        var smember = member.toString();
        val = obj[smember];
        if (smember.startsWith("-")) {
            return obj[smember.slice(1)];
        } else if (isJSFn(val)) {
            return val.call(obj);
        } else {
            return val;
        }
    } else if (isList(member)) {
        var name = str(car(member));
        val = obj[name];
        if (name.startsWith("-")) {
            return obj[name.slice(1)];
        } else if (isJSFn(val)) {
            var args = mapA(function(x) {
                return evaluate(x, env);
            }, cdr(member));
            return val.apply(obj, args);
        } else {
            throw new Error(
                str('invalid member access: "', prnStr(form), '"')
            );
        }
    } else {
        throw new Error(str('invalid member access: "', prnStr(form), '"'));
    }
}
