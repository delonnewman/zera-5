import {
    isJSFn,
    Var,
    Vector,
    vector,
    keyword,
    CURRENT_NS
} from "./runtime";

import { env, Env } from "./evaluator/Env";

function ZeraError(msg, stack, parent) {
    this.msg = msg;
    this.stack = stack;
    this.parent = parent;
}

function isSelfEvaluating(form) {
    return isAtomic(form) || isJSFn(form);
}

const top = env();
const MSG_KEY = keyword("msg");
const FN_KEY = keyword("fn");
const FILE_KEY = keyword("file");
const LINE_KEY = keyword("line");

// TODO: add try, catch, finally
export function evaluate(form_: any, env_: Env = top, stack_: Vector = vector()) {
    var stack, env, recur, ret, form;
    try {
        recur = true;
        ret = null;
        form = macroexpand(form_, env_, stack);
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
                var tag = str(car(form));
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
