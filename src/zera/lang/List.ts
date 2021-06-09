function List() { }
List.$zera$tag = "zera.lang.List";
List.$zera$isProtocol = true;
List.$zera$protocols = { "zera.lang.Seq": Seq };
List.prototype = Object.create(Seq.prototype);

function isList(x) {
    return isa(x, List);
}
