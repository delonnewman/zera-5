// Set

function ASet(meta) {
    this.$zera$meta = meta;
}
ASet.$zera$isProtocol = true;
ASet.$zera$tag = "zera.lang.ASet";
ASet.$zera$protocols = { "zera.lang.IObj": IObj };
ASet.prototype = Object.create(IObj.prototype);

function isSet(x) {
    return x instanceof ASet; // || Object.prototype.toString.call('[object Set]');
}
