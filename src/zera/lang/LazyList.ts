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

function isLazySeq(x) {
    return isa(x, LazyList);
}

function take(n, xs) {
    if (arguments.length !== 2) {
        throw new Error(
            str(
                "Wrong number of arguments expected: 2, got: ",
                arguments.length
            )
        );
    }
    return lazySeq(function() {
        if (n >= 0) {
            return cons(first(xs), take(n - 1, rest(xs)));
        } else {
            return null;
        }
    });
}

function N(n) {
    var n_ = n == null ? 0 : n;
    return cons(
        n_,
        lazySeq(function() {
            return N(n_ + 1);
        })
    );
}

function range(x, y, z) {
    var start, stop, step;
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
    } else {
        throw new Error(
            str(
                "Expected between 1 and 3 arguments, got: ",
                arguments.length
            )
        );
    }
    return lazySeq(function() {
        if (start === stop) {
            return null;
        } else {
            return cons(start, range(start + step, stop, step));
        }
    });
}

function repeat(n) {
    return lazySeq(function() {
        return cons(n, repeat(n));
    });
}
