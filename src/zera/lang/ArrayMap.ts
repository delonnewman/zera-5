/**
 * @constructor
 * @extends {AMap}
 */
// TODO: add IHashEq
function ArrayMap(meta, array) {
    this.$zera$array = array ? array : [];
    if (this.$zera$array.length % 2 !== 0)
        throw new Error("Maps should have an even number of entries");
    this.$zera$meta = meta;
    this.$zera$typeName = ArrayMap.$zera$tag;
    ZeraType.call(this, ArrayMap.$zera$tag, null, ArrayMap.$zera$protocols);
}

ArrayMap.$zera$tag = Sym.intern("zera.lang.ArrayMap");
ArrayMap.$zera$isType = true;
ArrayMap.$zera$protocols = {
    "zera.lang.IMeta": IMeta,
    "zera.lang.AMap": AMap,
};
ArrayMap.prototype = Object.create(AMap.prototype);

ArrayMap.EMPTY = new ArrayMap(null, []);

ArrayMap.createFromEntries = function(entries) {
    var i,
        e,
        a = [];
    for (i = 0; i < entries.length; i++) {
        e = entries[i];
        if (isMapEntry(e)) {
            a.push(e.key());
            a.push(e.val());
        } else if (isArray(e) && e.length === 2) {
            a.push(e[i]);
            a.push(e[i + 1]);
        } else {
            throw new Error("Invalid map entry");
        }
    }

    return new ArrayMap(null, a);
};

ArrayMap.prototype.count = function() {
    return this.$zera$array.length / 2;
};

ArrayMap.prototype.meta = function() {
    return this.$zera$meta == null ? arrayMap() : this.$zera$meta;
};

ArrayMap.prototype.withMeta = function(meta) {
    return new ArrayMap(meta, this.$zera$array);
};

ArrayMap.prototype.toString = function() {
    var buff = [],
        i;
    var array = this.$zera$array;
    for (i = 0; i < array.length; i += 2) {
        buff.push(str(prnStr(array[i]), " ", prnStr(array[i + 1])));
    }
    return str("{", buff.join(", "), "}");
};

ArrayMap.prototype.conj = function(entries) {
    var i,
        x,
        array = this.$zera$array,
        a = [];
    for (i = 0; i < array.length; i++) {
        a.push(array[i]);
    }
    for (i = 0; i < entries.length; i++) {
        x = mapEntry(entries[i]);
        a.push(x.key());
        a.push(x.val());
    }
    return new ArrayMap(this.meta(), a);
};

ArrayMap.prototype.entries = function() {
    var array = this.$zera$array;
    var i;
    var res = [];
    for (i = 0; i < array.length; i += 2) {
        res.push(new MapEntry(array[i], array[i + 1]));
    }
    return list.apply(null, res);
};

ArrayMap.prototype.seq = ArrayMap.prototype.entries;

ArrayMap.prototype.keys = function() {
    var entries = this.$zera$array;
    var i;
    var res = [];
    for (i = 0; i < entries.length; i += 2) {
        res.push(entries[i]);
    }
    return list.apply(null, res);
};

ArrayMap.prototype.vals = function() {
    var entries = this.$zera$array;
    var i;
    var res = [];
    for (i = 0; i < entries.length; i += 2) {
        res.push(entries[i + 1]);
    }
    return list.apply(null, res);
};

ArrayMap.prototype.find = function(key) {
    var val,
        i,
        entries = this.$zera$array;
    for (i = 0; i < entries.length; i += 2) {
        if (equals(entries[i], key)) {
            val = entries[i + 1];
            return val;
        }
    }
    return null;
};

ArrayMap.prototype.apply = function(x, args) {
    return this.find(args[0]);
};

ArrayMap.prototype.assoc = function(pairs) {
    var i;
    if (pairs.length % 2 !== 0)
        throw new Error("key value pairs must be even to assoc");
    var entries = Array.prototype.slice.call(this.$zera$array);
    for (i = 0; i < pairs.length; i += 2) {
        entries.push(pairs[i]);
        entries.push(pairs[i + 1]);
    }
    return new ArrayMap(null, entries);
};

ArrayMap.prototype.dissoc = function(key) {
    var i,
        newArray = [],
        array = this.$zera$array;
    for (i = 0; i < array.length; i += 2) {
        if (!equals(array[i], key)) {
            newArray.push(array[i]);
            newArray.push(array[i + 1]);
        }
    }
    return new ArrayMap(this.meta(), newArray);
};

ArrayMap.prototype.containsKey = function(key) {
    var i,
        array = this.$zera$array;
    for (i = 0; i < array.length; i += 2) {
        if (equals(array[i], key)) return true;
    }
    return false;
};

ArrayMap.prototype.contains = ArrayMap.prototype.containsKey;

// Equals
ArrayMap.prototype.equals = function(other) {
    var a, i, key, val;
    if (!isArrayMap(other)) {
        return false;
    } else if (this.count() !== other.count()) {
        return false;
    } else {
        a = this.$zera$array;
        for (i = 0; i < a.length; i += 2) {
            key = a[i];
            val = a[i + 1];
            if (!equals(val, other.find(key))) return false;
        }
        return true;
    }
};

function isArrayMap(x) {
    return x instanceof ArrayMap;
}

function arrayMap() {
    return new ArrayMap(null, Array.prototype.slice.call(arguments));
}
