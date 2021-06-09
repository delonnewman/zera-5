// Vectors
// TODO: make Vector an abstract interface for PersistentVector and TransientVector
function Vector(meta, rep) {
    this.$zera$meta = meta;
    this.rep = rep == null ? [] : rep;
    ZeraType.call(this, Vector.$zera$tag, null, Vector.$zera$protocols);
}

Vector.$zera$tag = Sym.intern("zera.lang.Vector");
Vector.$zera$isType = true;
Vector.$zera$protocols = { "zera.lang.IObj": IObj };
Vector.prototype = Object.create(IObj.prototype);

Vector.EMPTY = new Vector(null, []);

Vector.prototype.toString = function() {
    return str("[", this.rep.map(prnStr).join(" "), "]");
};

Vector.prototype.toArray = function() {
    return this.rep;
};

// IMeta
Vector.prototype.meta = function() {
    return this.$zera$meta;
};

// Seqable
Vector.prototype.seq = function() {
    return arrayToList(this.rep);
};

Vector.prototype.count = function() {
    return this.rep.length;
};

Vector.prototype.find = function(k) {
    return this.rep[k];
};

Vector.prototype.contains = function(k) {
    return this.rep[k] != null;
};

Vector.prototype.nth = Vector.prototype.find;

Vector.prototype.conj = function(x) {
    return new Vector(null, this.rep.concat(x));
};

// Array
Vector.prototype.indexOf = function(v) {
    return this.rep.indexOf(v);
};

Vector.prototype.findIndex = function(f) {
    return this.rep.findIndex(f);
};

// Fn
Vector.prototype.apply = function(obj, args) {
    if (args.length !== 1) {
        throw new Error(
            str(
                "Wrong number of arguments got: ",
                args.length,
                ", expected: 1"
            )
        );
    }
    return this.find(args[0]);
};

// Equals
Vector.prototype.equals = function(other) {
    var a, b, i;
    if (!isVector(other)) {
        return false;
    } else if (this.rep.length !== other.rep.length) {
        return false;
    } else {
        a = this.rep;
        b = other.rep;
        for (i = 0; i < a.length; i++) {
            if (!equals(a[i], b[i])) return false;
        }
        return true;
    }
};

function nth(v, n) {
    if (isArray(v)) return v[n];
    else if (isJSFn(v.nth)) return v.nth(n);
    else {
        throw new Error(
            str("Don't know how to get the nth element from: ", prnStr(v))
        );
    }
}

function isVector(x) {
    return x instanceof Vector;
}

function vector() {
    return new Vector(null, Array.prototype.slice.call(arguments));
}

function vec(s) {
    var v = Vector.EMPTY,
        s_ = seq(s),
        x;
    while (s_ !== null) {
        x = first(s_);
        s_ = next(s_);
        v = v.conj(x);
    }
    return v;
}
