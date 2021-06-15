import { ARef } from "./ARef";
import { zeraType } from "../types";
import { Applicable, apply, cons, equals, prnStr, str, isEmpty, list, seq } from "../core";
import { ISeq } from "./Seq";

@zeraType('zera.lang.Atom', ARef)
export class Atom extends ARef {
    reset(newVal: any): Atom {
        this.validate(newVal);
        var oldVal = this.$zera$value;
        this.$zera$value = newVal;
        this.processWatchers(oldVal, newVal);
        return this;
    }

    swap(f: Applicable, args: any[]): Atom {
        var oldVal = this.$zera$value,
            newVal = apply(f, cons(oldVal, seq(args)));
        this.validate(newVal);
        this.$zera$value = newVal;
        this.processWatchers(oldVal, newVal);
        return this;
    }

    compareAndSet(oldVal: any, newVal: any): Atom {
        if (equals(this.$zera$value, oldVal)) {
            this.validate(newVal);
            this.$zera$value = newVal;
            this.processWatchers(oldVal, newVal);
        }
        return this;
    }

    toString() {
        return str("#<Atom value: ", prnStr(this.$zera$value), ">");
    }

    // TODO: complete ARef implementation
    private processWatchers(old: any, knew: any): void {
        var s,
            f,
            watchers = this.$zera$watchers;
        if (isEmpty(watchers)) return;
        for (s = watchers.entries(); s != null; s = s.next()) {
            var kv = s.first();
            f = kv.val();
            if (f != null) apply(f, list(kv.key(), this, old, knew));
            else {
                throw new Error("A watcher must be a function of 4 arguments");
            }
        }
    }

}

export function isAtom(x: any): boolean {
    return x instanceof Atom;
}

export function atom(x: any): Atom {
    return new Atom(null, x, null);
}

export function reset(atom: Atom, value: any) {
    return atom.reset(value);
}

export function swap(atom: Atom, f: Applicable, ...args: any[]) {
    return atom.swap(f, args);
}

export function compareAndSet(atom: Atom, oldVal: any, newVal: any) {
    return atom.compareAndSet(oldVal, newVal);
}
