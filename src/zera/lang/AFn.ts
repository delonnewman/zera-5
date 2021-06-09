function AFn(meta) {
    this.$zera$meta = meta;
}
AFn.$zera$isProtocol = true;
AFn.$zera$tag = "zera.lang.AFn";
AFn.$zera$protocols = { "zera.lang.IObj": IObj };
AFn.prototype = Object.create(IObj.prototype);

AFn.prototype.invoke = function() {
    throw new Error("unimplemented");
};

AFn.prototype.call = function(obj) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this.invoke.apply(this, args);
};

AFn.prototype.apply = function(obj, args) {
    return this.invoke.apply(this, args);
};

AFn.prototype.meta = function() {
    return this.$zera$meta;
};
