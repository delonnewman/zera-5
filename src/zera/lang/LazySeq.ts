/**
 * @constructor
 * @implements {Seq}
 */
function LazySeq(seq, fn) {
    this.fn = fn == null ? null : fn;
    this._seq = seq == null ? null : seq;
    this._sv = null;
    this.$zera$typeName = LazySeq.$zera$tag;
    ZeraType.call(this, LazySeq.$zera$typeName, null, LazySeq.$zera$protocols);
}

LazySeq.$zera$isType = true;
LazySeq.$zera$tag = Sym.intern('zera.lang.LazySeq');
LazySeq.$zera$protocols = { 'zera.lang.Seq': Seq };
LazySeq.prototype = Object.create(Seq.prototype);

LazySeq.prototype.sval = function() {
    if (this.fn != null) {
        this._sv = this.fn.call();
        this.fn = null;
    }
    if (this._sv != null) {
        return this._sv;
    }
    return this._seq;
};

// Sequable
LazySeq.prototype.seq = function() {
    this.sval();
    if (this._sv != null) {
        var ls = this._sv;
        this._sv = null;
        while (ls instanceof LazySeq) {
            ls = ls.sval();
        }
        this._seq = ls;
    }
    return this._seq;
};

LazySeq.prototype.count = function() {
    var c = 0, s;
    for (s = this; s != null; s = s.next()) {
        c++;
    }
    return c;
};

LazySeq.prototype.cons = function(x) {
    return cons(x, this.seq());
};

LazySeq.prototype.first = function() {
    this.seq();
    if (this._seq == null) {
        return null;
    }
    return this._seq.first();
};

LazySeq.prototype.next = function() {
    this.seq();
    if (this._seq == null) {
        return null;
    }
    return this._seq.next();
};

LazySeq.prototype.rest = function() {
    var val = this.next();
    if (val == null) return Cons.EMPTY;
    else return val;
};

LazySeq.prototype.isEmpty = function() {
    return this.seq() === null;
};

LazySeq.prototype.toString = function() {
    if (this.isEmpty()) return '()';
    var buff = [];
    var seq = this.seq();
    while (seq != null) {
        p(first(seq));
        seq = seq.next();
    }
    return '(' + buff.join(' ') + ')';
};
