function Fn(meta, env, arglists, bodies, isMethod) {
    AFn.call(this, meta);
    this.$zera$env = env;
    this.$zera$arglists = arglists;
    this.$zera$bodies = bodies;
    this.$zera$isMethod = isMethod;
    ZeraType.call(this, Fn.$zera$tag, null, Fn.$zera$protocols);
}

Fn.$zera$tag = Sym.intern("zera.lang.Fn");
Fn.$zera$isType = true;
Fn.$zera$protocols = { "zera.lang.AFn": AFn };
Fn.prototype = Object.create(AFn.prototype);

Fn.prototype.isMethod = function() {
    return this.$zera$isMethod;
};

Fn.prototype.toString = function() {
    return str(
        "#<Fn arglists: ",
        prnStr(Object.values(this.$zera$arglists)),
        ", bodies: ",
        prnStr(Object.values(this.$zera$bodies)),
        ">"
    );
};

Fn.prototype.analyze = function() { };

Fn.prototype.toFunction = function() {
    var self = this;
    return function() {
        return self.invoke.apply(self, arguments);
    };
};

Fn.prototype.invoke = function() {
    var i,
        ret,
        args = Array.prototype.slice.call(arguments),
        argc = args.length,
        bodies = this.$zera$bodies,
        env = this.$zera$env,
        body = bodies[argc],
        names = this.$zera$arglists[argc];

    if (body == null) {
        for (i = argc * -1; i <= 0; i++) {
            body = bodies[i];
            if (body != null) {
                names = this.$zera$arglists[i];
                break;
            }
        }
        if (body == null) {
            throw new Error(
                str(
                    "Wrong number of arguments, got: ",
                    args.length,
                    " ",
                    prnStr(this)
                )
            );
        }
    }

    loop: while (true) {
        try {
            var namec = calculateArity(names);
            argc = count(args);
            if (namec < 0 && argc < Math.abs(namec) - 1) {
                throw new Error(
                    str(
                        "Wrong number of arguments, expected at least: ",
                        Math.abs(namec) - 1,
                        ", got: ",
                        argc
                    )
                );
            } else if (namec > 0 && namec !== argc) {
                throw new Error(
                    str(
                        "Wrong number of arguments, expected: ",
                        namec,
                        ", got: ",
                        argc
                    )
                );
            }

            // bind arguments
            var binds = bindArguments(names, intoArray(args));
            for (i = 0; i < binds.length; i++) {
                var name = binds[i][0];
                var value = binds[i][1];
                defineLexically(env, name, value);
            }

            // evaluate body
            var exp = car(body),
                exprs = cdr(body);
            while (exp != null) {
                ret = evaluate(exp, env);
                exp = car(exprs);
                exprs = cdr(exprs);
            }
            break;
        } catch (e) {
            //p(e.args);
            if (e instanceof RecursionPoint) {
                args = e.args;
                continue loop;
            } else {
                throw e;
            }
        }
    }
    return ret;
};
