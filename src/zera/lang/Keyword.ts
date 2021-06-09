import { AObj, IObj } from "./IObj"
import { AMeta } from "./IMeta"
import { Named } from "./Named"
import { zeraType } from "../types"
import { isJSFn } from "../core"
import { Symbol, isSymbol } from "./Symbol"

@zeraType('zera.lang.Keyword', Named, AObj)
export class Keyword extends Named {
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

    // Invokable
    apply(_: null, args: any[]) {
        if (args.length !== 1)
            throw new Error("Keywords expect one and only one argument");
        if (isJSFn(args[0].apply)) {
            return args[0].apply(null, [this]);
        } else {
            throw new Error("Symbols expect and argument this is invokable");
        }
    };
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
