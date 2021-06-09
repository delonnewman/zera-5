/**
 * @abstract
 */
function ARef(meta, value, validator) {
    AReference.call(this, meta);
    this.$zera$watchers = arrayMap();
    this.$zera$validator = validator;
    this.$zera$value = value;
}
ARef.$zera$tag = "zera.lang.ARef";
ARef.$zera$protocols = {
    "zera.lang.ARefernce": AReference,
    "zera.lang.IMeta": IMeta,
};
ARef.$zera$isProtocol = true;
ARef.prototype = Object.create(AReference.prototype);

// TODO: complete ARef implementation
function processWatchers(ref, old, knew) {
    var s,
        f,
        watchers = ref.$zera$watchers;
    if (isEmpty(watchers)) return;
    for (s = watchers.entries(); s != null; s = s.next()) {
        var kv = s.first();
        f = kv.val();
        if (f != null && (isFn(f) || isInvocable(f)))
            apply(f, list(kv.key(), ref, old, knew));
        else {
            throw new Error("A watcher must be a function of 4 arguments");
        }
    }
}

ARef.prototype.deref = function() {
    return this.$zera$value;
};

ARef.prototype.validate = function(value) {
    var v = this.$zera$validator;
    if (v != null && (isFn(v) || isInvocable(v))) {
        if (!apply(v, list(value ? value : this.$zera$value)))
            throw new Error("Not a valid value for this atom");
    }
};

ARef.prototype.addWatch = function(key, f) {
    this.$zera$watchers = this.$zera$watchers.assoc([key, f]);
    return this;
};

ARef.prototype.removeWatch = function(key) {
    this.$zera$watchers = this.$zera$watchers.dissoc(key);
    return this;
};

ARef.prototype.setValidator = function(f) {
    this.$zera$validator = f;
    return this;
};

function addWatch(ref, key, f) {
    if (ref instanceof ARef) return ref.addWatch(key, f);
    throw new Error(
        "Can only add watchers to ARef instances (e.g. atoms and vars)"
    );
}

function removeWatch(ref, key, f) {
    if (ref instanceof ARef) return ref.removeWatch(key, f);
    throw new Error(
        "Can only remove watchers from ARef instances (e.g. atoms and vars)"
    );
}

function setValidator(ref, key, f) {
    if (ref instanceof ARef) return ref.setValidator(key, f);
    throw new Error(
        "Can only set validators for ARef instances (e.g. atoms and vars)"
    );
}

function deref(ref) {
    if (ref instanceof ARef) return ref.deref();
    throw new Error(
        "Can only dereference ARef instances (e.g. atoms and vars)"
    );
}
