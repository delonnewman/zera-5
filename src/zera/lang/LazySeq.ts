import { zeraType } from "../types";
import { Seq, ISeq } from "./Seq";
import { PersistentList } from "./PersistentList";
import { Applicable, apply, cons } from "../core";

@zeraType('zera.lang.LazySeq', Seq)
export class LazySeq {
    private _fn: Applicable | null;
    private _seq: ISeq | null;
    private _sv: ISeq | null;

    constructor(seq: ISeq | null, fn: Applicable | null) {
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
