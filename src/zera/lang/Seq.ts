import { IMeta } from "./IMeta"

function Seq(meta) {
    this.$zera$meta = meta;
}

Seq.$zera$isProtocol = true;
Seq.$zera$tag = "zera.lang.Seq";
Seq.$zera$protocols = { "zera.lang.IObj": IObj };
Seq.prototype = Object.create(IObj.prototype);

Seq.prototype.first = function() {
    throw new Error("unimplmented");
};

Seq.prototype.rest = function() {
    throw new Error("unimplmented");
};

Seq.prototype.cons = function(x) {
    throw new Error("unimplmented");
};

Seq.prototype.equals = function(other) {
    var a, b, xa, xb, xsa, xsb;
    if (!isSeq(other)) {
        return false;
    } else if (this.isEmpty() && this.isEmpty()) {
        return true;
    } else if (this.count() != other.count()) {
        return false;
    } else {
        xsa = this;
        xsb = other;
        while (xsa != null) {
            xa = xsa.first();
            xb = xsb.first();
            if (!equals(xa, xb)) {
                return false;
            }
            xsa = xsa.next();
            xsb = xsb.next();
        }
        return true;
    }
};

function seq(x) {
    if (x == null) return null;
    else if (isSeq(x)) {
        if (isEmpty(x)) return null;
        return x;
    } else if (isFunction(x.seq)) {
        var s = x.seq();
        if (isEmpty(s)) return null;
        return s;
    } else if (isArrayLike(x)) {
        if (x.length === 0) return null;
        return arrayToList(x);
    } else {
        throw new Error(prnStr(x) + " is not a valid Seq or Seqable");
    }
}

function isSeq(x) {
    return isa(x, Seq);
}

function isSeqable(x) {
    if (x == null) return true;
    if (isArrayLike(x)) return true;
    return isJSFn(x.seq);
}
