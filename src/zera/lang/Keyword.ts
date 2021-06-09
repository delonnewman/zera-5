import { Named } from "./Named";
import { zeraType } from "../types";
import { isJSFn } from "../core";
import { Symbol } from "./Symbol";
import { IFn, AFn } from "./AFn";

@zeraType('zera.lang.Keyword', Named, AFn)
export class Keyword extends Named implements IFn {
    static table: { [key: string]: Keyword } = {};

    private $zera$sym: Symbol;

    constructor(sym: Symbol) {
        super();
        this.$zera$sym = sym;
    }

    static intern(sym: Symbol): Keyword {
        var kw = Keyword.table[sym.toString()];
        if (!kw) kw = Keyword.table[sym.toString()] = new Keyword(sym);
        return kw;
    }

    name() {
        return this.$zera$sym.name();
    }

    namespace() {
        return this.$zera$sym.namespace();
    }

    toString() {
        return `:${this.$zera$sym}`;
    }

    equals(o: any): boolean {
        if (o == null || !isKeyword(o)) return false;
        return this.namespace() === o.namespace() && this.name() === o.name();
    }

    invoke(...args: any[]) {
        if (args.length !== 1)
            throw new Error("Keywords expect one and only one argument");
        if (isJSFn(args[0].apply)) {
            return args[0].apply(null, [this]);
        } else {
            throw new Error("Keywords expect an argument this is invokable");
        }
    };

    call(_: any, ...args: any[]) {
        return this.invoke.apply(this, args);
    }

    apply(_: any, args: any[]) {
        return this.invoke.apply(this, args);
    }
}

export function isKeyword(x: any): boolean {
    return x instanceof Keyword;
}

export function keyword(...args: string[]) {
    if (args.length === 1) {
        return Keyword.intern(new Symbol(null, args[0]));
    } else if (args.length === 2) {
        return Keyword.intern(new Symbol(args[0], args[1]));
    } else {
        throw new Error(`Wrong number of arguments expected 1 or 2, got: ${arguments.length}`);
    }
}
