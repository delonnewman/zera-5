/**
 * @constructor
 * @implements {Seq}
 */
function PersistentList(meta, car, cdr, count) {
    Seq.call(this, meta);
    this.$zera$car = car;
    this.$zera$cdr = cdr;
    this.$zera$count = count;
    ZeraType.call(
        this,
        PersistentList.$zera$tag,
        null,
        PersistentList.$zera$protocols
    );
}

PersistentList.$zera$tag = Sym.intern("zera.lang.PersistentList");
PersistentList.$zera$isType = true;
PersistentList.$zera$protocols = {
    "zera.lang.IMeta": IMeta,
    "zera.lang.Seq": Seq,
    "zera.lang.AMap": AMap,
    "zera.lang.List": List,
};
PersistentList.prototype = Object.create(Seq.prototype);

PersistentList.EMPTY = new PersistentList(null, null, null, 0);

PersistentList.prototype.meta = function() {
    return this.$zera$meta == null ? arrayMap() : this.$zera$meta;
};

PersistentList.prototype.withMeta = function(meta) {
    return new PersistentList(
        meta,
        this.$zera$car,
        this.$zera$cdr,
        this.$zera$count
    );
};

PersistentList.prototype.first = function() {
    return this.$zera$car;
};

PersistentList.prototype.rest = function() {
    if (this.next() == null) {
        return PersistentList.EMPTY;
    } else {
        return this.next();
    }
};

PersistentList.prototype.count = function() {
    return this.$zera$count;
};

PersistentList.prototype.next = function() {
    return this.$zera$cdr;
};

PersistentList.prototype.cons = function(x) {
    if (this.isEmpty()) {
        return new PersistentList(this.$zera$meta, x, null, 1);
    }
    return new PersistentList(
        this.$zera$meta,
        x,
        this,
        this.$zera$count + 1
    );
};

PersistentList.prototype.conj = function(vals) {
    var i,
        xs = this;
    for (i = 0; i < vals.length; i++) {
        xs = xs.cons(vals[i]);
    }
    return xs;
};

PersistentList.prototype.isEmpty = function() {
    return this.$zera$count === 0;
};

PersistentList.prototype.isList = function() {
    return true;
};

// Seqable
PersistentList.prototype.seq = function() {
    return this;
};

function cons(x, col) {
    if (col == null) {
        return new PersistentList(null, x, null, 1);
    } else if (isSeq(col)) {
        return new Cons(null, x, col);
    } else if (isSeqable(col)) {
        return new Cons(null, x, seq(col));
    } else {
        throw new Error(str("Don't know how to cons: ", prnStr(col)));
    }
}

function isPersistentList(x) {
    return isa(x, PersistentList);
}

// make a list out of conses
function list() {
    if (arguments.length === 0) {
        return PersistentList.EMPTY;
    } else if (arguments.length === 1) {
        return cons(arguments[0], null);
    }
    var i, x;
    var xs = null;
    for (i = arguments.length - 1; i >= 0; i--) {
        x = arguments[i];
        xs = cons(x, xs);
    }
    return xs;
}

