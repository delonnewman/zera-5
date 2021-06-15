import { zeraType } from "../types";
import { Seq, ISeq } from "./Seq";
import { PersistentList } from "./PersistentList";
import { Applicable, apply, cons, first, rest } from "../core";

@zeraType('zera.lang.LazySeq', Seq)
export class LazySeq extends Seq implements ISeq {
    private _fn: Applicable | null;
    private _seq: ISeq | null;
    private _sv: ISeq | null;

    constructor(seq: ISeq | null, fn: Applicable | null) {
        super(null);

        this._fn = fn == null ? null : fn;
        this._seq = seq == null ? null : seq;
        this._sv = null;
    }

    sval() {
        if (this._fn != null) {
            this._sv = apply(this._fn);
            this._fn = null;
        }

        if (this._sv != null) {
            return this._sv;
        }

        return this._seq;
    }

    // Sequable
    seq(): ISeq | null {
        this.sval();

        if (this._sv != null) {
            var ls: ISeq | null = this._sv;
            this._sv = null;

            while (ls instanceof LazySeq) {
                ls = ls.sval();
            }

            this._seq = ls;
        }

        return this._seq;
    }

    count(): number {
        var c = 0, s;
        for (s = this; s != null; s = s.next()) {
            c++;
        }
        return c;
    }

    cons(x: any): ISeq {
        return cons(x, this.seq());
    }

    first(): any {
        this.seq();

        if (this._seq == null) {
            return null;
        }

        return this._seq.first();
    }

    next(): ISeq | null {
        this.seq();

        if (this._seq == null) {
            return null;
        }

        return this._seq.next();
    }

    rest(): ISeq {
        var val = this.next();

        if (val == null) {
            return PersistentList.EMPTY;
        }
        else {
            return val;
        }
    }

    isEmpty(): boolean {
        return this.seq() === null;
    }

    toString() {
        if (this.isEmpty()) return '()';

        var buff: any[] = [];
        var seq: ISeq | null = this.seq();

        while (seq != null) {
            seq = seq.next();
        }

        return '(' + buff.join(' ') + ')';
    }
}

export function isLazySeq(x: any): boolean {
    return x instanceof LazySeq;
}

export function lazySeq(fn: Applicable) {
    return new LazySeq(null, fn);
}

export function take(n: number, xs: ISeq): LazySeq {
    return lazySeq(function() {
        if (n >= 0) {
            return cons(first(xs), take(n - 1, rest(xs)));
        } else {
            return null;
        }
    });
}

export function N(n: number): LazySeq {
    var n_ = n == null ? 0 : n;
    return lazySeq(() => cons(n_, N(n_ + 1)));
}

export function range(x: number, y: number, z: number): LazySeq {
    var start: number, stop: number, step: number;

    if (arguments.length === 1) {
        start = 0;
        stop = x;
        step = 1;
    } else if (arguments.length === 2) {
        start = x;
        stop = y;
        step = 1;
    } else if (arguments.length === 3) {
        start = x;
        stop = y;
        step = z;
    }

    return lazySeq(() => {
        if (start === stop) {
            return null;
        } else {
            return cons(start, range(start + step, stop, step));
        }
    });
}

export function repeat(n: number): LazySeq {
    return lazySeq(() => cons(n, repeat(n)));
}
