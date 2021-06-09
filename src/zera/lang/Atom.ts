function Atom(meta, value, validator) {
    ARef.call(this, meta, value, validator);
    ZeraType.call(this, Atom.$zera$tag, null, Atom.$zera$protocols);
}

Atom.$zera$tag = Sym.intern("zera.lang.Atom");
Atom.$zera$isType = true;
Atom.$zera$protocols = { "zera.lang.ARef": ARef };
Atom.prototype = Object.create(ARef.prototype);

Atom.prototype.reset = function(newVal) {
    this.validate(newVal);
    var oldVal = this.$zera$value;
    this.$zera$value = newVal;
    processWatchers(this, oldVal, newVal);
    return this;
};

Atom.prototype.swap = function(f, args) {
    if (!isFn(f) && !isInvocable(f))
        throw new Error("Can only swap atomic value with a function");
    var oldVal = this.$zera$value,
        newVal = apply(f, cons(oldVal, args));
    this.validate(newVal);
    this.$zera$value = newVal;
    processWatchers(this, oldVal, newVal);
    return this;
};

Atom.prototype.compareAndSet = function(oldVal, newVal) {
    if (equals(this.$zera$value, oldVal)) {
        this.validate(newVal);
        this.$zera$value = newVal;
        processWatchers(this, oldVal, newVal);
    }
    return this;
};

Atom.prototype.toString = function() {
    return str("#<Atom value: ", prnStr(this.$zera$value), ">");
};

function isAtom(x) {
    return x instanceof Atom;
}

function atom(x) {
    return new Atom(null, x);
}

function reset(atom, value) {
    if (isAtom(atom)) return atom.reset(value);
    throw new Error("Can only reset the value of Atoms");
}

function swap(atom, f) {
    var args = Array.prototype.slice.call(arguments, 2);
    if (isAtom(atom)) return atom.swap(f, args);
    throw new Error("Can only reset the value of Atoms");
}

function compareAndSet(atom, oldVal, newVal) {
    if (isAtom(atom)) return atom.compareAndSet(oldVal, newVal);
    throw new Error("Can only compare and set the value of Atoms");
}
