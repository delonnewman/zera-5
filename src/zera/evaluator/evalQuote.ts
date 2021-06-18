import { first, rest } from "../runtime"

export function evalQuote(form: any): any {
    return first(rest(form));
}
