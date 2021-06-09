/**
 * @constructor
 */
function MapEntry(key, val) {
    this.$zera$key = key;
    this.$zera$val = val;
    ZeraType.call(this, MapEntry.$zera$tag, null, {});
}

MapEntry.$zera$isType = true;
MapEntry.$zera$tag = Sym.intern("zera.lang.MapEntry");

MapEntry.prototype.key = function() {
    return this.$zera$key;
};

MapEntry.prototype.val = function() {
    return this.$zera$val;
};

MapEntry.prototype.first = MapEntry.prototype.key;
MapEntry.prototype.next = MapEntry.prototype.val;

MapEntry.prototype.rest = function() {
    return list(this.val());
};

MapEntry.prototype.nth = function(n) {
    if (n === 0) return this.key();
    else if (n === 1) return this.val();
    else {
        return null;
    }
};

MapEntry.prototype.apply = function(obj, args) {
    if (args.length !== 1) {
        throw new Error(
            str(
                "Wrong number of arguments got: ",
                args.length,
                ", expected: 1"
            )
        );
    }
    return this.nth(args[0]);
};

MapEntry.prototype.toString = function() {
    return str("[", prnStr(this.key()), " ", prnStr(this.val()), "]");
};

function isMapEntry(x) {
    return x instanceof MapEntry;
}

function mapEntry(x) {
    if (isMapEntry(x)) return x;
    else if (isArray(x) && x.length === 2) {
        return new MapEntry(x[0], x[1]);
    } else if (isVector(x) && x.count() === 2) {
        return new MapEntry(nth(x, 0), nth(x, 1));
    } else {
        throw new Error(
            str(
                "Don't know how to coerce '",
                prnStr(x),
                "' into a zera.MapEntry"
            )
        );
    }
}
