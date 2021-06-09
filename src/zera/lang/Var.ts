// TODO: complete Var implementation
function Var(meta, namespace, name) {
    this.$zera$ns = namespace;
    this.$zera$name = name;
    //ARef.call(this, meta);
    this.$zera$meta = meta || arrayMap();
    ZeraType.call(this, Var.$zera$tag, null, Var.$zera$protocols);
}

Var.$zera$tag = Sym.intern("zera.lang.Var");
Var.$zera$isType = true;
Var.$zera$protocols = { "zera.lang.ARef": ARef };
Var.prototype = Object.create(ARef.prototype);

Var.intern = function(ns, sym, init) {
    var ns_ = isNamespace(ns) ? ns : Namespace.findOrCreate(ns);
    var v = ns_.intern(sym);
    if (init != null) v.set(init);
    v.resetMeta(sym.meta() || arrayMap());
    return v;
};

Var.prototype.get = function() {
    return this.$zera$value;
};

Var.prototype.resetMeta = function(m) {
    this.$zera$meta = m;
    return this.$zera$meta;
};

Var.prototype.meta = function() {
    return this.$zera$meta;
};

Var.prototype.set = function(value) {
    this.validate(value);
    if (this.$zera$value == null || this.isDynamic()) {
        var old = this.$zera$value;
        this.$zera$value = value;
        processWatchers(this, old, value);
        return value;
    } else {
        throw new Error("Can't set Var value once it has been set");
    }
};

Var.prototype.setDynamic = function() {
    this.$zera$meta = this.$zera$meta.assoc([
        Keyword.intern("dynamic"),
        true,
    ]);
    return this;
};

Var.prototype.isDynamic = function() {
    return !!this.$zera$meta.find(Keyword.intern("dynamic"));
};

Var.prototype.setMacro = function() {
    this.$zera$meta = this.$zera$meta.assoc([
        Keyword.intern("macro"),
        true,
    ]);
    return this;
};

Var.prototype.isMacro = function() {
    return !!this.$zera$meta.find(Keyword.intern("macro"));
};

Var.prototype.toString = function() {
    return str("#'", this.$zera$ns.name(), "/", this.$zera$name);
};

function define(ns, name, init) {
    return Var.intern(ns, Sym.intern(name), init);
}

function isVar(x) {
    return x instanceof Var;
}

function varGet(v) {
    if (isVar(v)) return v.get();
    throw new Error("var-get can only be used on Vars");
}

function varSet(v, value) {
    if (isVar(v)) return v.set(value);
    throw new Error("var-set can only be used on Vars");
}
