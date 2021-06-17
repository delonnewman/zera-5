import {
    isJSFn,
    isMap,
    isVector,
    isArray,
    isSet,
    isSymbol,
    isList,
    isEmpty,
    isError,
    isString,
    isBoolean,
    isNumber,
    isKeyword,
    str,
    intoArray,
    into,
    first,
    ASet,
    HashSet,
    Map,
    ArrayMap,
    MapEntry,
    key,
    val,
    map,
    Vector,
    vector,
    keyword,
    withMeta,
    NIL_SYM
} from "../runtime"

import { env, Env } from "./Env"
import { macroexpand } from "./macroexpand"
import { findVar } from "./findVar"

export * from "./Env"
export * from "./macroexpand"
export * from "./findVar"

class ZeraError {
    public msg: string;
    public stack: Vector;
    public parent: object;

    constructor(msg: string, stack: Vector, parent: object) {
        this.msg = msg;
        this.stack = stack;
        this.parent = parent;
    }
}

function isAtomic(x: any): boolean {
    return (
        isBoolean(x) ||
        isNumber(x) ||
        isString(x) ||
        isKeyword(x) ||
        x == null
    );
}

function isSelfEvaluating(form: any): boolean {
    return isAtomic(form) || isJSFn(form);
}

const top = env();
const MSG_KEY = keyword("msg");
const FN_KEY = keyword("fn");
const FILE_KEY = keyword("file");
const LINE_KEY = keyword("line");

function evalArray(form: any[], env: Env): any[] {
    return form.map((x) => evaluate(x, env));
}

function evalVector(form: Vector, env: Env): Vector {
    return new Vector(form.meta(), evalArray(form.toArray(), env));
}

function evalMap(form: Map, env: Env): any {
    var seq = map((x: MapEntry) => [evaluate(key(x), env), evaluate(val(x), env)], form),
        m: Map = into(ArrayMap.EMPTY, seq);

    if (form.meta()) return withMeta(m, form.meta());

    return m;
}

function evalSet(form: ASet, env: Env) {
    var seq = map((x) => evaluate(x, env), form),
        s = into(HashSet.EMPTY, seq);
    if (form.meta()) return s.withMeta(form.meta());
    return s;
}
// TODO: add try, catch, finally
export function evaluate(form_: any, env: Env = top, stack: Vector = vector()) {
    try {
        let recur = true;
        let ret = null;
        let form = macroexpand(form_, env, stack);
        while (recur) {
            recur = false;
            if (form == null || NIL_SYM.equals(form)) {
                ret = null;
            } else if (isSelfEvaluating(form)) {
                ret = form;
            } else if (isMap(form)) {
                ret = evalMap(form, env);
            } else if (isVector(form)) {
                ret = evalVector(form, env);
            } else if (isArray(form)) {
                ret = evalArray(form, env);
            } else if (isSet(form)) {
                ret = evalSet(form, env);
            } else if (isSymbol(form)) {
                ret = evalSymbol(form, env);
            } else if (isList(form)) {
                if (isEmpty(form)) return form;
                var tag = str(first(form));
                switch (tag) {
                    case "quote":
                        ret = evalQuote(form);
                        break;
                    case "do":
                        ret = evalDoBlock(form, env);
                        break;
                    case "let":
                        ret = evalLetBlock(form, env);
                        break;
                    case "def":
                        ret = evalDefinition(form, env);
                        break;
                    case "var":
                        ret = evalVar(form, env);
                        break;
                    case "set!":
                        ret = evalAssignment(form, env);
                        break;
                    case "cond":
                        ret = evalConditional(form, env);
                        break;
                    case "fn":
                        ret = evalFunction(form, env);
                        break;
                    case "loop":
                        ret = evalLoop(form, env);
                        break;
                    case "recur":
                        ret = evalRecursionPoint(form, env);
                        break;
                    case "throw":
                        ret = evalThrownException(form, env);
                        break;
                    case "new":
                        ret = evalClassInstantiation(form, env);
                        break;
                    case ".":
                        ret = evalMemberAccess(form, env);
                        break;
                    case "defmacro":
                        ret = evalMacroDefinition(form, env);
                        break;
                    default:
                        ret = evalApplication(form, env, stack);
                        break;
                }
            } else {
                console.error("Invalid form", form);
                throw new Error(str('invalid form: "', form, '"'));
            }
        }
        return ret;
    } catch (e) {
        if (e instanceof ZeraError) {
            throw new ZeraError(e.msg, e.stack, e.parent);
        } else if (isError(e)) {
            throw new ZeraError(e.message, intoArray(stack), e);
        } else if (isString(e)) {
            throw new ZeraError(e, intoArray(stack), new Error(e));
        } else {
            throw e;
        }
    }
}
