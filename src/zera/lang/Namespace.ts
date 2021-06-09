function Namespace(name) {
    if (!isSymbol(name))
        throw new Error(
            str("Namespace name should be a symbol, got: ", prnStr(name))
        );
    this.$zera$name = name;
    // TODO: should these be maps in atoms?
    this.$zera$mappings = {};
    this.$zera$aliases = {};
    ZeraType.call(
        this,
        Namespace.$zera$tag,
        null,
        Namespace.$zera$protocols
    );
    AReference.call(this, name.meta());
}

Namespace.$zera$tag = Sym.intern("zera.lang.Namespace");
Namespace.$zera$protocols = {
    "zera.lang.AReference": AReference,
    "zera.lang.IMeta": IMeta,
};
Namespace.$zera$isType = true;

Namespace.prototype = Object.create(null);

Namespace.namespaces = {};

Namespace.all = function() {
    return list.apply(null, Object.values(Namespace.namespaces));
};

Namespace.findOrCreate = function(name) {
    var ns = Namespace.namespaces[name];
    if (ns != null) return ns;
    else {
        ns = new Namespace(name);
        Namespace.namespaces[name] = ns;
    }
    return ns;
};

Namespace.findOrDie = function(name) {
    var ns = Namespace.namespaces[name];
    if (ns != null) return ns;
    else {
        throw new Error(str("Can't find the namespace: ", name));
    }
};

Namespace.prototype.name = function() {
    return this.$zera$name;
};

Namespace.prototype.meta = function() {
    return this.$zera$meta;
};

Namespace.prototype.mappings = function() {
    return objectToMap(this.$zera$mappings, symbol);
};

Namespace.prototype.mapping = function(sym) {
    return this.$zera$mappings[sym];
};

Namespace.prototype.refer = function(sym, v) {
    this.$zera$mappings[sym] = v;
    return this;
};

Namespace.prototype.intern = function(sym) {
    if (!isSymbol(sym))
        throw new Error("Namespace can only intern symbols");
    if (sym.namespace() != null)
        throw new Error("Cannot intern namespace-qualified symbol");
    var v = new Var(null, this, sym);
    this.$zera$mappings[sym] = v;
    return v;
};

Namespace.prototype.findInternedVar = function(sym) {
    return this.$zera$mappings[sym];
};

Namespace.prototype.toString = function() {
    return str("#<Namespace name: ", this.$zera$name, ">");
};

Namespace.prototype.getAliases = function() {
    return objectToMap(this.$zera$aliases);
};

Namespace.prototype.addAlias = function(sym, ns) {
    if (sym == null || ns == null) {
        throw new Error("Expecting Symbol + Namespace");
    }

    if (!this.$zera$aliases[sym]) {
        this.$zera$aliases[sym] = ns;
    }
};

Namespace.prototype.lookupAlias = function(sym) {
    return this.$zera$aliases[sym];
};

Namespace.prototype.removeAlias = function(alias) {
    delete this.$zera$aliases[alias];
};

Namespace.prototype.toJSModule = function() {
    return mapO(
        function(v, k) {
            return v.get();
        },
        this.$zera$mappings,
        zeraNameToJS
    );
};

function theNS(ns) {
    if (isNamespace(ns)) return ns;
    return Namespace.findOrDie(ns);
}

function nsName(ns) {
    var ns_ = theNS(ns);
    return ns_.name();
}

function isNamespace(x) {
    return x instanceof Namespace;
}

function createNS(sym) {
    return Namespace.findOrCreate(sym);
}

function findNS(sym) {
    return Namespace.namespaces[sym];
}

function nsMap(sym) {
    var ns = theNS(sym);
    return ns.mappings();
}

function initNamespace(sym) {
    var ns = Namespace.findOrCreate(sym);
    CURRENT_NS.set(ns);
    return null;
}
