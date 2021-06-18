
export function evalDoBlock(form, env) {
    var x = first(rest(form)),
        xs = rest(rest(form)),
        ret;
    while (x != null) {
        ret = evaluate(x, env);
        x = xs.first();
        xs = xs.rest();
    }
    return ret;
}
