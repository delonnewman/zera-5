
export function evalLoop(form, env_) {
    var binds = car(cdr(form));
    var body = cdr(cdr(form));
    var scope = env(env_);
    var ret = null;

    if (count(binds) % 2 !== 0) {
        throw new Error("loop requires an even number of bindings");
    }

    // bind variables & collect names
    var i;
    var binds_ = intoArray(binds);
    var names = [],
        name,
        value,
        evaled;
    for (i = 0; i < binds_.length; i += 2) {
        name = binds_[i];
        value = binds_[i + 1];
        names.push(name);
        evaled = evaluate(value, scope);
        defineLexically(scope, name);
        defineLexically(scope, name, evaled);
    }

    loop: while (true) {
        try {
            // evaluate body
            var exp = car(body),
                exprs = cdr(body);
            while (exp != null) {
                ret = evaluate(exp, scope);
                exp = car(exprs);
                exprs = cdr(exprs);
            }
            break;
        } catch (e) {
            //p(e.args);
            if (e instanceof RecursionPoint) {
                if (names.length !== e.args.length) {
                    throw new Error(
                        str(
                            "Wrong number or arguments, expected: ",
                            names.length,
                            " got: ",
                            e.args.length
                        )
                    );
                }
                for (i = 0; i < names.length; i++) {
                    defineLexically(scope, names[i], e.args[i]);
                }
                continue loop;
            } else {
                throw e;
            }
        }
    }
    return ret;
}
