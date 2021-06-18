import { prnStr, car, cdr, conj, Vector, map, apply } from "../runtime"
import { evaluate, Env } from "./index"

export function evalApplication(form: any, env: Env, stack: Vector): any {
    console.log('form', prnStr(form));
    var stack_ = conj(stack, car(form));
    var fn = evaluate(car(form), env, stack_);
    console.log('fn', fn);
    var args = cdr(form);
    console.log('args', prnStr(args));
    var args_ = map((x: any) => evaluate(x, env, stack_), args);
    console.log('args_', prnStr(args_));
    return apply(fn, args_);
}
