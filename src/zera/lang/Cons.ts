function Cons(meta, first, more) {
    Seq.call(this, meta);
    this._first = first;
    this._more = more;
    ZeraType.call(this, Cons.$zera$tag, null, Cons.$zera$protocols);
}

Cons.$zera$tag = Sym.intern("zera.lang.Cons");
Cons.$zera$isType = true;
Cons.$zera$protocols = { "zera.lang.List": List };
Cons.prototype = Object.create(Seq.prototype);

// ISeq
Cons.prototype.first = function() {
    return this._first;
};

// ISeq
Cons.prototype.more = function() {
    if (this._more == null) return PersistentList.EMPTY;
    return this._more;
};

// ISeq
Cons.prototype.next = function() {
    return this.more().seq();
};

Cons.prototype.count = function() {
    return 1 + count(this._more);
};

// Seqable
Cons.prototype.seq = function() {
    return this;
};

// IMeta
Cons.prototype.withMeta = function(meta) {
    return new Cons(meta, this._first, this._more);
};

Cons.prototype.meta = function() {
    return this.$zera$meta;
};

function car(cons) {
    if (cons == null) return null;
    if (cons != null && isJSFn(cons.first)) return cons.first();
    throw new Error(str("Not a valid Cons: ", prnStr(cons)));
}

function cdr(cons) {
    if (cons == null) return null;
    if (isJSFn(cons.next)) {
        return cons.next();
    }
    throw new Error(str("Not a valid Cons: ", prnStr(cons)));
}

function isCons(x) {
    return isa(x, Cons);
}
