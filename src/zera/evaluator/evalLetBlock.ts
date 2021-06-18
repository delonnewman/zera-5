import { Env, defineLexically, env } from "./Env"
import { evaluate } from "./index"

import { pt, first, rest, isVector, count, gensym, str } from "../runtime"

export function evalLetBlock(form: any, env_: Env): any {
    pt('let', form);
    var rest: any = rest(form);
    var binds = first(rest);
    var body = rest(rest);
    var scope = env(env_);

    if (!isVector(binds) && count(binds) % 2 === 0) {
        throw new Error(
            "Bindings should be a vector with an even number of elements"
        );
    }
    binds = binds.toArray();

    var i, name, sname;
    for (i = 0; i < binds.length; i += 2) {
        name = binds[i];
        sname = str(name);
        if (sname.endsWith("#")) {
            name = gensym(str(sname.slice(0, sname.length - 1)));
        }
        defineLexically(scope, name, null);
        defineLexically(scope, name, evaluate(binds[i + 1], scope));
    }

    var x = first(body),
        xs = rest(body),
        ret;
    while (x != null) {
        ret = evaluate(x, scope);
        x = xs.first();
        xs = xs.rest();
    }
    return ret;
}
