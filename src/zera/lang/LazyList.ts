function LazyList(seq, fn) {
    this.fn = fn == null ? null : fn;
    this._seq = seq == null ? null : seq;
    this._sv = null;
}

LazyList.prototype = Object.create(List.prototype);

LazyList.prototype.sval = function() {
    if (this.fn != null) {
        this._sv = this.fn.call();
        this.fn = null;
    }
    if (this._sv != null) {
        return this._sv;
    }
    return this._seq;
};

LazyList.prototype.seq = function() {
    this.sval();
    if (this._sv != null) {
        var ls = this._sv;
        this._sv = null;
        while (ls instanceof LazyList) {
            ls = ls.sval();
        }
        this._seq = ls;
    }
    return this._seq;
};

LazyList.prototype.count = function() {
    var c = 0,
        s;
    for (s = this; s != null; s = s.next()) {
        c++;
    }
    return c;
};

LazyList.prototype.cons = function(x) {
    return cons(x, this.seq());
};

LazyList.prototype.first = function() {
    this.seq();
    if (this._seq == null) {
        return null;
    }
    return this._seq.first();
};

LazyList.prototype.next = function() {
    this.seq();
    if (this._seq == null) {
        return null;
    }
    return this._seq.next();
};

var LazySeq = LazyList;

function lazySeq(fn) {
    return new LazyList(null, fn);
}

