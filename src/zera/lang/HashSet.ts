function HashSet(meta, map) {
    APersistentSet.call(this, meta, map);
    ZeraType.call(this, HashSet.$zera$tag, null, HashSet.$zera$protocols);
}

HashSet.$zera$isType = true;
HashSet.$zera$tag = Sym.intern("zera.lang.HashSet");
HashSet.$zera$protocols = {
    "zera.lang.APersistentSet": APersistentSet,
    "zera.lang.IObj": IObj,
};

HashSet.createFromArray = function(a) {
    var i,
        entries = [];
    for (i = 0; i < a.length; i++) {
        entries.push(a[i]);
        entries.push(a[i]);
    }
    return new HashSet(null, new ArrayMap(null, entries));
};

HashSet.prototype = Object.create(APersistentSet.prototype);

HashSet.EMPTY = new HashSet(null, ArrayMap.EMPTY);

HashSet.prototype.conj = function(vals) {
    var i,
        a = [];
    for (i = 0; i < vals.length; i++) {
        a.push([vals[i], vals[i]]);
    }
    return new HashSet(this.meta(), this.$zera$rep.conj(a));
};

HashSet.prototype.withMeta = function(meta) {
    return new HashSet(this.meta(), this.$zera$rep);
};

HashSet.prototype.disjoin = function(key) {
    if (this.contains(key)) {
        return new HashSet(this.meta(), this.$zera$rep.dissoc(key));
    }
    return this;
};

function createSet(seq) {
    if (seq == null) return HashSet.EMPTY;
    if (isArrayLike(seq)) {
        return HashSet.createFromArray(seq);
    } else {
        var x = seq.first();
        var xs = seq.rest();
        var a = [];
        while (xs.next()) {
            a.push(x);
            xs = xs.rest();
            x = xs.first();
        }
        return HashSet.createFromArray(a);
    }
}
