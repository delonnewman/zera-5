/**
 * @abstract
 * @implements {Seq}
 */
function AMap() { }
AMap.$zera$isProtocol = true;
AMap.$zera$tag = "zera.lang.AMap";
AMap.$zera$protocols = { "zera.lang.IObj": IObj };
AMap.prototype = extendWithProtocols(
    AMap,
    Object.values(AMap.$zera$protocols)
);

function isMap(x) {
    return (
        x instanceof AMap ||
        Object.prototype.toString.call(x) === "[object Map]"
    );
}

function entries(m) {
    if (isJSFn(m.entries)) return m.entries();
    else {
        throw new Error(
            str("Don't know how to get the entries of: ", prnStr(m))
        );
    }
}

function find(m, key) {
    if (isJSFn(m.find)) {
        return m.find(key);
    } else {
        throw new Error(
            str("Don't know how to find value by key in: ", prnStr(m))
        );
    }
}

function get(m, key, alt) {
    if (isJSFn(m.find)) {
        var val = m.find(key);
        if (alt == null) {
            return val ? val : null;
        } else {
            return val ? val : alt;
        }
    } else {
        throw new Error(
            str("Don't know how to get value by key from: ", prnStr(m))
        );
    }
}

function assoc(m) {
    var pairs = Array.prototype.slice.call(arguments, 1);
    if (isJSFn(m.assoc)) {
        return m.assoc(pairs);
    } else {
        throw new Error(str("Don't know how to assoc: ", prnStr(m)));
    }
}

// TODO: add variable number of keys
function dissoc(m, k) {
    if (isJSFn(m.dissoc)) {
        return m.dissoc(k);
    } else {
        throw new Error(str("Don't know how to dissoc: ", prnStr(m)));
    }
}

function keys(m) {
    if (isJSFn(m.keys)) {
        return m.keys();
    } else {
        throw new Error(
            str("Don't know how to get keys from: ", prnStr(m))
        );
    }
}

function vals(m) {
    if (isJSFn(m.vals)) {
        return m.vals();
    } else {
        throw new Error(
            str("Don't know how to get vals from: ", prnStr(m))
        );
    }
}

function key(m) {
    if (isJSFn(m.key)) {
        return m.key();
    } else {
        throw new Error(str("Don't know how to get key from: ", prnStr(m)));
    }
}

function val(m) {
    if (isJSFn(m.val)) {
        return m.val();
    } else {
        throw new Error(str("Don't know how to get val from: ", prnStr(m)));
    }
}

function containsKey(m, k) {
    if (m.containsKey) {
        return m.containsKey(k);
    } else if (isJSFn(m.has)) {
        return m.has(k);
    } else {
        throw new Error(str("Not a valid map"));
    }
}

function contains(col, k) {
    if (isJSFn(col.contains)) {
        return col.contains(k);
    } else if (isJSFn(col.has)) {
        return col.has(k);
    } else {
        throw new Error(
            str(prnStr(col), " is not an associative collection")
        );
    }
}
