import { zeraType } from "../types"
import { MetaData, AFn, IFn, IJSFunction, IApplicable } from "./index"

import { defineLexically, Env } from "../evaluator"

import {
    prnStr,
    count,
    str,
    intoArray,
    RecursionPoint,
    first,
    next,
    equals,
    AMP_SYM,
    list
} from "../runtime"

export type Applicable = IFn | IJSFunction | IApplicable | any[];
export type ArgList = any;
export type Body = any;

function isAmp(x: any): boolean {
    return equals(x, AMP_SYM);
}

export function calculateArity(args: any[]): number {
    var argc = args.length,
        i = args.findIndex(isAmp);
    if (i !== -1) {
        argc = -1 * (argc - 1);
    }
    return argc;
}

export function bindArguments(names: any[], values: any[]): any[] {
    var i,
        xs,
        capture = false,
        args = [];
    for (i = 0; i < names.length; i++) {
        if (capture === true) {
            xs = values.slice(i - 1, values.length);
            args.push([names[i], list.apply(null, xs)]);
            break;
        } else {
            args.push([names[i], values[i]]);
        }
        if (equals(names[i], AMP_SYM)) capture = true;
    }
    return args;
}

@zeraType('zera.lang.Fn', AFn)
export class Fn extends AFn implements IFn {
    private $zera$env: Env;
    private $zera$arglists: ArgList[];
    private $zera$bodies: Body[];
    private $zera$isMethod: boolean;

    constructor(meta: MetaData, env: Env, arglists: ArgList[], bodies: Body[], isMethod: boolean) {
        super(meta);
        this.$zera$env = env;
        this.$zera$arglists = arglists;
        this.$zera$bodies = bodies;
        this.$zera$isMethod = isMethod;
    }

    isMethod() {
        return this.$zera$isMethod;
    }

    toString() {
        return `#<Fn arglists: ${prnStr(Object.values(this.$zera$arglists))}, bodies: ${prnStr(Object.values(this.$zera$bodies))}>`
    }

    toFunction() {
        var self = this;
        return function(...args: any) {
            return self.invoke.apply(self, args);
        }
    }

    invoke() {
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
                var exp = first(body),
                    exprs = next(body);
                while (exp != null) {
                    ret = evaluate(exp, env);
                    exp = first(exprs);
                    exprs = next(exprs);
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
    }
}
