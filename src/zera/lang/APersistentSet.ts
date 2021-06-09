function APersistentSet(meta, map) {
    this.$zera$rep = map || arrayMap();
    ASet.call(this, meta);
}

APersistentSet.$zera$isProtocol = true;
APersistentSet.$zera$tag = "zera.lang.APersistentSet";
APersistentSet.$zera$protocols = { "zera.lang.ASet": ASet };

APersistentSet.prototype = Object.create(ASet.prototype);

APersistentSet.prototype.toString = function() {
    return str("#{", this.toArray().join(" "), "}");
};

APersistentSet.prototype.toArray = function() {
    return intoArray(this.seq());
};

APersistentSet.prototype.get = function(key) {
    return this.$zera$rep.find(key);
};

APersistentSet.prototype.count = function() {
    return this.$zera$rep.count();
};

APersistentSet.prototype.seq = function() {
    return this.$zera$rep.keys();
};

APersistentSet.prototype.apply = function(x, args) {
    return this.get(args[0]);
};

APersistentSet.prototype.equals = function(o) {
    return o instanceof ASet && this.$zera$rep.equals(o.$zera$rep);
};

APersistentSet.prototype.contains = function(val) {
    return this.$zera$rep.containsKey(val);
};

APersistentSet.prototype.meta = function() {
    return this.$zera$meta == null ? arrayMap() : this.$zera$meta;
};

APersistentSet.prototype.first = function() {
    return this.seq().first();
};

APersistentSet.prototype.rest = function() {
    return this.seq().rest();
};

APersistentSet.prototype.next = function() {
    return this.seq().next();
};
