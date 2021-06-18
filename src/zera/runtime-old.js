// jshint esversion: 5
// jshint eqnull: true
// jshint evil: true

var zera = (function () {
    "use strict";

    var isNode =
        typeof module !== "undefined" && typeof module.exports !== "undefined";
    var isBrowser = typeof window !== "undefined";

    function lookup(env, name) {
        if (env == null) {
            return null;
        } else if (env.vars != null && env.vars[name] !== void 0) {
            return env;
        } else {
            if (env.parent == null) {
                return null;
            } else {
                var scope = env.parent;
                while (scope != null) {
                    if (scope.vars != null && scope.vars[name] !== void 0) {
                        return scope;
                    }
                    scope = scope.parent;
                }
                return null;
            }
        }
    }


    function reverse(xs) {
        if (isEmpty(xs)) {
            return PersistentList.EMPTY;
        } else {
            var xs_ = cdr(xs),
                x = car(xs),
                l = PersistentList.EMPTY;
            while (x) {
                l = cons(x, l);
                x = car(xs_);
                xs_ = cdr(xs_);
            }
            return l;
        }
    }

    function isTaggedValue(x) {
        return isList(x) && isSymbol(car(x));
    }

    var AMP_FORM = Sym.intern("&form");
    var AMP_ENV = Sym.intern("&env");

    // TODO: set &form and &env in macro scope
    function macroexpand(form, env_, stack) {
        var stack_;
        if (isTaggedValue(form)) {
            var sym = car(form);
            stack_ = conj(stack, sym);
            var name = sym.toString();
            if (SPECIAL_FORMS[name]) {
                return form;
            } else if (name !== ".-" && name.startsWith(".-")) {
                return list(".", car(cdr(form)), Sym.intern(name.slice(1)));
            } else if (name !== "." && name.startsWith(".")) {
                return list(
                    DOT_SYM,
                    car(cdr(form)),
                    cons(Sym.intern(name.slice(1)), cdr(cdr(form)))
                );
            } else if (name.endsWith(".")) {
                return cons(
                    NEW_SYM,
                    cons(Sym.intern(name.replace(/\.$/, "")), cdr(form))
                );
            } else {
                var v = findVar(sym, true); // will return null on error rather than throw an exception
                if (v == null) return form;
                if (v.isMacro()) {
                    var scope = env(env_);
                    defineLexically(scope, AMP_ENV, scope);
                    defineLexically(scope, AMP_FORM, form);
                    return macroexpand(
                        apply(v.get(), next(form)),
                        scope,
                        stack_
                    );
                } else {
                    return form;
                }
            }
        }
        return form;
    }

    function evalArray(form, env) {
        return form.map(function (x) {
            return evaluate(x, env);
        });
    }

    function evalVector(form, env) {
        return new Vector(form.meta(), evalArray(form.toArray(), env));
    }

    function evalMap(form, env) {
        var seq = map(function (x) {
                return [evaluate(x.key(), env), evaluate(x.val(), env)];
            }, form),
            m = into(ArrayMap.EMPTY, seq);
        if (form.meta()) return m.withMeta(form.meta());
        return m;
    }

    function evalSet(form, env) {
        var seq = map(function (x) {
                return evaluate(x, env);
            }, form),
            s = into(HashSet.EMPTY, seq);
        if (form.meta()) return s.withMeta(form.meta());
        return s;
    }

    function processMethodDef(meth) {
        var name = first(meth);
        var forms = cons(Sym.intern("fn"), rest(meth));
        var fn = evalFunction(forms, top, true);
        return function () {
            return fn.invoke.apply(
                fn,
                [this].concat(Array.prototype.slice.call(arguments))
            );
        };
    }

    function collectProtocols(proto) {
        var protos = proto.$zera$protocols;
        var protoEntries = [];
        if (protos) {
            if (!isMap(protos)) {
                protos = objectToMap(protos);
            }
            protos = values(protos);
            map(collectProtocols, values(protos));
        }
    }

    // macro
    function defineType(name, fields) {
        if (!isVector(fields))
            throw new Error("fields should be a vector if symbols");
        var specs = Array.prototype.slice.call(arguments, 2);

        var argc = count(fields);
        var tag = Sym.intern(str(CURRENT_NS.get().name(), "/", name));

        var type = function () {
            if (arguments.length !== argc) {
                throw new Error(
                    str(
                        "Wrong number of arguments got: ",
                        arguments.length,
                        ", expected: ",
                        argc
                    )
                );
            }
            var fields_ = seq(fields);
            var fname = first(fields_);
            var i = 0;
            while (fields_ !== null) {
                this[str(fname)] = arguments[i];
                i++;
                fields_ = next(fields_);
                fname = first(fields_);
            }
            ZeraType.call(this, tag, fields, protocols);
        };

        type.prototype = Object.create(ZeraType.prototype);

        var i,
            spec,
            meth,
            protocol = null,
            proto,
            protocols = {}; // TODO: change to a transient-map
        for (i = 0; i < specs.length; i++) {
            spec = specs[i];
            if (isList(spec)) {
                if (protocol !== null) {
                    // TODO: add parent protocols to mapping (see collectProtocols)
                    // TODO: check if method is declared as part of the protocol in scope
                }
                if (count(spec) < 2)
                    throw new Error(
                        "A method signature must have a name and a vector of arguments"
                    );
                meth = first(spec);
                type.prototype[meth] = processMethodDef(spec);
            } else if (isSymbol(spec)) {
                protocol = evaluate(spec);
                protocols[protocol.$zera$tag] = protocol;
            }
        }

        type.$zera$isType = true;
        type.$zera$tag = tag;
        type.$zera$protocols = protocols;

        return list(DEF_SYM, name, type);
    }

    function defineProtocol(name, x) {
        var doc, specs;

        if (isString(x)) {
            doc = x;
            specs = Array.prototype.slice.call(arguments, 2);
        } else {
            specs = Array.prototype.slice.call(arguments, 1);
        }

        var proto = function () {
            this.$zera$typeName = proto.$zera$tag;
        };

        proto.$zera$isProtocol = true;
        proto.$zera$tag = Sym.intern(str(CURRENT_NS.get().name(), "/", name));

        var i,
            spec,
            meth,
            protocol = null,
            proto,
            protocols = arrayMap(); // TODO: change to a transient-map
        for (i = 0; i < specs.length; i++) {
            spec = specs[i];
            if (isList(spec)) {
                if (protocol !== null) {
                    // TODO: check if method is declared as part of the protocol in scope
                    proto = evaluate(protocol);
                    protocols = protocols.assoc(protocol, proto);
                }
                // TODO: add parent protocols to mapping (see collectProtocols)
                if (count(spec) < 2)
                    throw new Error(
                        "A method signature must have a name and a vector of arguments"
                    );
                meth = first(spec);
                proto.prototype[meth] = processMethodDef(spec);
            } else if (isSymbol(spec)) {
                protocol = evaluate(spec);
            }
        }

        proto.$zera$protocols = protocols;

        if (doc) name = name.withMeta(arrayMap(keyword("doc"), doc));
        return list(DEF_SYM, name, proto);
    }

    var JS_GLOBAL_OBJECT = Var.intern(
        ZERA_NS,
        Sym.intern("*js-global-object*"),
        isNode ? "global" : "window"
    ).setDynamic();

    function compileKeyword(form, env) {
        if (form.namespace()) {
            return str(
                'zera.core.keyword("',
                form.namespace(),
                '", "',
                form.name(),
                '")'
            );
        } else {
            return str('zera.core.keyword("', form.name(), '")');
        }
    }

    var SPECIALS = {
        "+": "__PLUS__",
        "-": "__MINUS__",
        "!": "__BANG__",
        "?": "__QEST__",
        "*": "__STAR__",
        ">": "__GT__",
        "<": "__LT__",
        "=": "__EQ__",
    };

    function encodeName(name) {
        //return name.split('').map(function(x) { return SPECIALS[x] ? SPECIALS[x] : x; }).join('');
        return zeraNameToJS(name);
    }

    function isRecur(x) {
        return isList(x) && RECUR_SYM.equals(first(x));
    }

    function isThrow(x) {
        return isList(x) && THROW_SYM.equals(first(x));
    }

    function dropLast(l) {
        return reverse(cdr(reverse(l)));
    }

    // Fn -> Seqable -> Array
    function mapA(f, l) {
        if (isEmpty(l)) {
            return [];
        } else {
            return intoArray(seq(l)).map(f);
        }
    }

    // Function -> Object -> Object
    // Function -> Object -> Function -> Object
    function mapO(f, obj, keyXForm) {
        var i,
            key,
            val,
            key_,
            keys = Object.keys(obj),
            o = {};
        for (i = 0; i < keys.length; i++) {
            key = keys[i];
            key_ = isJSFn(keyXForm) ? keyXForm.call(null, key) : key;
            val = obj[key];
            o[key_] = f.call(null, val, key, key_);
        }
        return o;
    }

    function cap(x) {
        if (x.length === 0) return x;
        return str(x[0].toUpperCase(), x.slice(1));
    }

    function readJS(exp) {
        var i;
        if (isString(exp)) {
            if (exp.startsWith(":")) {
                return Keyword.intern(exp.substring(1));
            } else if (exp.startsWith("'")) {
                return list(QUOTE_SYM, Sym.intern(exp.substring(1)));
            } else if (exp.startsWith('"') && exp.endsWith('"')) {
                return exp.substring(1).substring(0, exp.length - 2);
            } else {
                return Sym.intern(exp);
            }
        } else if (isArray(exp)) {
            if (exp.length === 0) return PersistentList.EMPTY;
            if (exp.length === 1)
                return cons(readJS(exp[0]), PersistentList.EMPTY);
            var xs = null;
            var last = null,
                x;
            for (i = exp.length - 1; i >= 0; i--) {
                // use & to read pairs
                if (exp[i] === "&") {
                    if (exp.length === 2)
                        return cons(PersistentList.EMPTY, readJS(last));
                    i--;
                    x = cons(readJS(exp[i]), last);
                    if (exp.length === 3) return x;
                    xs = dropLast(xs);
                } else {
                    x = readJS(exp[i]);
                }
                xs = cons(x, xs);
                last = x;
            }
            return xs;
        } else if (isJSFn(exp)) return exp;
        else if (isObject(exp)) {
            var keys = Object.getOwnPropertyNames(exp);
            if (keys.length === 0) return ArrayMap.EMPTY;
            var entries = [];
            for (i = 0; i < keys.length; i++) {
                entries.push(Sym.intern(keys[i]));
                entries.push(readJS(exp[keys[i]]));
            }
            return new ArrayMap(null, entries);
        } else {
            return exp;
        }
    }

    function readJSON(exp) {
        return readJS(JSON.parse(exp));
    }

    function evalJS(exp) {
        return evaluate(readJS(exp));
    }

    function evalJSON(json) {
        return evaluate(readJSON(json));
    }

    // primitive types
    define(ZERA_NS, "zera.lang.IMeta", IMeta);
    define(ZERA_NS, "zera.lang.IObj", IObj);
    define(ZERA_NS, "zera.lang.AReference", AReference);
    define(ZERA_NS, "zera.lang.ARef", ARef);
    define(ZERA_NS, "zera.lang.Named", Named);
    define(ZERA_NS, "zera.lang.Symbol", Sym);
    define(ZERA_NS, "zera.lang.Keyword", Keyword);
    define(ZERA_NS, "zera.lang.Seq", Seq);
    define(ZERA_NS, "zera.lang.List", List);
    define(ZERA_NS, "zera.lang.PersistentList", PersistentList);
    define(ZERA_NS, "zera.lang.Vector", Vector);
    define(ZERA_NS, "zera.lang.Cons", Cons);
    define(ZERA_NS, "zera.lang.LazySeq", LazySeq);
    define(ZERA_NS, "zera.lang.MapEntry", MapEntry);
    define(ZERA_NS, "zera.lang.AMap", AMap);
    define(ZERA_NS, "zera.lang.ArrayMap", ArrayMap);
    define(ZERA_NS, "zera.lang.ASet", ASet);
    define(ZERA_NS, "zera.lang.APersistentSet", APersistentSet);
    define(ZERA_NS, "zera.lang.HashSet", HashSet);
    define(ZERA_NS, "zera.lang.Var", Var);
    define(ZERA_NS, "zera.lang.Namespace", Namespace);

    // primitive functions
    define(ZERA_NS, "isa?", isa);
    define(ZERA_NS, "var?", isVar);
    define(ZERA_NS, "fn?", isFunction);
    define(ZERA_NS, "invokable?", isInvocable);
    define(ZERA_NS, "var-get", varGet);
    define(ZERA_NS, "var-set", varSet);
    define(ZERA_NS, "add-watch", addWatch);
    define(ZERA_NS, "remove-watch", removeWatch);
    define(ZERA_NS, "set-validator!", setValidator);
    define(ZERA_NS, "deref", deref);
    define(ZERA_NS, "atom", atom);
    define(ZERA_NS, "atom?", isAtom);
    define(ZERA_NS, "reset!", reset);
    define(ZERA_NS, "swap!", swap);
    define(ZERA_NS, "compare-and-set!", compareAndSet);
    define(ZERA_NS, "ns", initNamespace).setMacro();
    define(ZERA_NS, "the-ns", theNS);
    define(ZERA_NS, "ns-name", nsName);
    define(ZERA_NS, "create-ns", createNS);
    define(ZERA_NS, "find-ns", findNS);
    define(ZERA_NS, "ns-map", nsMap);
    define(ZERA_NS, "alias", alias);
    define(ZERA_NS, "ns-aliases", nsAliases);
    define(ZERA_NS, "ns-unalias", nsUnalias);
    define(ZERA_NS, "meta", meta);
    define(ZERA_NS, "with-meta", withMeta);
    define(ZERA_NS, "alter-meta", alterMeta);
    define(ZERA_NS, "reset-meta", resetMeta);
    define(ZERA_NS, "eval", evaluate);
    define(ZERA_NS, "read-string", readString);
    define(ZERA_NS, "apply*", apply);
    define(ZERA_NS, "macroexpand1", macroexpand);
    define(ZERA_NS, "nil?", isNil);
    define(ZERA_NS, "empty?", isEmpty);
    define(ZERA_NS, "list", list);
    define(ZERA_NS, "array?", isArray);
    define(ZERA_NS, "array-like?", isArrayLike);
    define(ZERA_NS, "array-map", arrayMap);
    define(ZERA_NS, "array-map?", isArrayMap);
    define(ZERA_NS, "map?", isMap);
    define(ZERA_NS, "map-entry?", isMapEntry);
    define(ZERA_NS, "contains-key?", containsKey);
    define(ZERA_NS, "contains?", contains);
    define(ZERA_NS, "entries", entries);
    define(ZERA_NS, "get", get);
    define(ZERA_NS, "assoc", assoc);
    define(ZERA_NS, "dissoc", dissoc);
    define(ZERA_NS, "keys", keys);
    define(ZERA_NS, "vals", vals);
    define(ZERA_NS, "key", key);
    define(ZERA_NS, "val", val);
    define(ZERA_NS, "set", createSet);
    define(ZERA_NS, "set?", isSet);
    define(ZERA_NS, "list?", isList);
    define(ZERA_NS, "lazy-seq?", isLazySeq);
    define(ZERA_NS, "seq", seq);
    define(ZERA_NS, "seq?", isSeq);
    define(ZERA_NS, "seqable?", isSeqable);
    define(ZERA_NS, "cons", cons);
    define(ZERA_NS, "count", count);
    define(ZERA_NS, "car", car);
    define(ZERA_NS, "cdr", cdr);
    define(ZERA_NS, "map", map);
    define(ZERA_NS, "into", into);
    define(ZERA_NS, "into-array", intoArray);
    define(ZERA_NS, "reduce", reduce);
    define(ZERA_NS, "filter", filter);
    define(ZERA_NS, "remove", remove);
    define(ZERA_NS, "take", take);
    define(ZERA_NS, "range", range);
    define(ZERA_NS, "N", N);
    define(ZERA_NS, "repeat", repeat);
    define(ZERA_NS, "first", first);
    define(ZERA_NS, "rest", rest);
    define(ZERA_NS, "next", next);
    define(ZERA_NS, "conj", conj);
    define(ZERA_NS, "cons?", isCons);
    define(ZERA_NS, "pair", pair);
    define(ZERA_NS, "pr-str", prnStr);
    define(ZERA_NS, "prn-str", prnStr);
    define(ZERA_NS, "pr", prn);
    define(ZERA_NS, "prn", prn);
    define(ZERA_NS, "println", p);
    define(ZERA_NS, "say", p);
    define(ZERA_NS, "str", str);
    define(ZERA_NS, "boolean?", isBoolean);
    define(ZERA_NS, "true?", isTrue);
    define(ZERA_NS, "false?", isFalse);
    define(ZERA_NS, "string?", isString);
    define(ZERA_NS, "error?", isError);
    define(ZERA_NS, "symbol?", isSymbol);
    define(ZERA_NS, "symbol", symbol);
    define(ZERA_NS, "gensym", gensym);
    define(ZERA_NS, "keyword", keyword);
    define(ZERA_NS, "keyword?", isKeyword);
    define(ZERA_NS, "name", name);
    define(ZERA_NS, "namespace", namespace);
    define(ZERA_NS, "number?", isNumber);
    define(ZERA_NS, "integer?", isInteger);
    define(ZERA_NS, "even?", isEven);
    define(ZERA_NS, "odd?", isOdd);
    define(ZERA_NS, "positive?", isPositive);
    define(ZERA_NS, "negative?", isNegative);
    define(ZERA_NS, "zero?", isZero);
    define(ZERA_NS, "num", num);
    define(ZERA_NS, "is", is);
    define(ZERA_NS, "ok", ok);
    define(ZERA_NS, "array?", isArray);
    define(ZERA_NS, "vector?", isVector);
    define(ZERA_NS, "vector", vector);
    define(ZERA_NS, "vec", vec);
    define(ZERA_NS, "nth", nth);
    define(ZERA_NS, "aset", aset);
    define(ZERA_NS, "aget", aget);
    define(ZERA_NS, "alength", alength);
    define(ZERA_NS, "int-array", intArray);
    define(ZERA_NS, "float-array", floatArray);
    define(ZERA_NS, "array", function () {
        return Array.prototype.slice.call(arguments);
    });
    define(ZERA_NS, "object->map", objectToMap);
    define(ZERA_NS, "object?", isObject);
    define(ZERA_NS, "read-js", readJS);
    define(ZERA_NS, "read-json", readJSON);
    define(ZERA_NS, "inst?", isDate);
    define(ZERA_NS, "regex?", isRegExp);

    define(ZERA_NS, "deftype", defineType).setMacro();
    define(ZERA_NS, "defprotocol", defineProtocol).setMacro();

    define(ZERA_NS, "identical?", function (a, b) {
        return a === b;
    });

    define(ZERA_NS, "equiv?", function (a, b) {
        return a == b;
    });

    define(ZERA_NS, "=", equals);
    define(ZERA_NS, "not=", function (a, b) {
        return !equals(a, b);
    });

    define(ZERA_NS, "assert", function (x) {
        if (x == null || x === false)
            throw new Error(str("Assert failed: ", prnStr(x)));
        return null;
    });

    define(ZERA_NS, "not", function (x) {
        return !x;
    });

    // bit operations
    define(ZERA_NS, "bit-not", function (x) {
        return ~x;
    });
    define(ZERA_NS, "bit-and", function (a, b) {
        return a & b;
    });
    define(ZERA_NS, "bit-or", function (a, b) {
        return a || b;
    });
    define(ZERA_NS, "bit-shift-left", function (a, b) {
        return a << b;
    });
    define(ZERA_NS, "bit-shift-right", function (a, b) {
        return a >> b;
    });
    define(ZERA_NS, "unsigned-bit-shift-right", function (a, b) {
        return a >>> b;
    });

    // TODO: rewrite these to match the Clojure API
    function lt(a, b) {
        if (arguments.length === 0) {
            throw new Error(
                str(
                    "Wrong number of arguments expected 1 or more, got: ",
                    arguments.length
                )
            );
        } else if (arguments.length === 1) {
            return true;
        } else if (arguments.length === 2) {
            return a < b;
        } else {
            if (a < b) {
                var i,
                    ret,
                    y = b,
                    more = Array.prototype.slice.call(arguments, 2);
                for (i = 0; i < more.length; i++) {
                    ret = y < more[i];
                    y = more[i];
                    more = more.slice(1);
                }
                return ret;
            }
            return false;
        }
    }
    define(ZERA_NS, "<", lt);

    function lteq(a, b) {
        if (arguments.length === 0) {
            throw new Error(
                str(
                    "Wrong number of arguments expected 1 or more, got: ",
                    arguments.length
                )
            );
        } else if (arguments.length === 1) {
            return true;
        } else if (arguments.length === 2) {
            return a <= b;
        } else {
            if (a <= b) {
                var i,
                    ret,
                    y = b,
                    more = Array.prototype.slice.call(arguments, 2);
                for (i = 0; i < more.length; i++) {
                    ret = y <= more[i];
                    y = more[i];
                    more = more.slice(1);
                }
                return ret;
            }
            return false;
        }
    }
    define(ZERA_NS, "<=", lteq);

    var gt = function (a, b) {
        if (arguments.length === 0) {
            throw new Error(
                str(
                    "Wrong number of arguments expected 1 or more, got: ",
                    arguments.length
                )
            );
        } else if (arguments.length === 1) {
            return true;
        } else if (arguments.length === 2) {
            return a > b;
        } else {
            if (a > b) {
                var i,
                    ret,
                    y = b,
                    more = Array.prototype.slice.call(arguments, 2);
                for (i = 0; i < more.length; i++) {
                    ret = y > more[i];
                    y = more[i];
                    more = more.slice(1);
                }
                return ret;
            }
            return false;
        }
    };
    define(ZERA_NS, ">", gt);

    var gteq = function (a, b) {
        if (arguments.length === 0) {
            throw new Error(
                str(
                    "Wrong number of arguments expected 1 or more, got: ",
                    arguments.length
                )
            );
        } else if (arguments.length === 1) {
            return true;
        } else if (arguments.length === 2) {
            return a >= b;
        } else {
            if (a >= b) {
                var i,
                    ret,
                    y = b,
                    more = Array.prototype.slice.call(arguments, 2);
                for (i = 0; i < more.length; i++) {
                    ret = y >= more[i];
                    y = more[i];
                    more = more.slice(1);
                }
                return ret;
            }
            return false;
        }
    };
    define(ZERA_NS, ">=", gteq);

    var add = function (x) {
        if (arguments.length === 0) {
            return 0;
        } else if (x == null) return null;
        else if (arguments.length === 1) {
            if (!isNumber(x)) throw new Error("Only numbers can be added");
            return x;
        } else {
            var i,
                sum = 0;
            for (i = 0; i < arguments.length; i++) {
                sum += 1 * arguments[i];
            }
            return sum;
        }
    };
    define(ZERA_NS, "+", add);

    var sub = function (x, y) {
        if (arguments.length === 0) {
            throw new Error(
                str(
                    "Wrong number of arguments expected 1 or more, got: ",
                    arguments.length
                )
            );
        } else if (arguments.length === 1) {
            if (!isNumber(x)) throw new Error("Only numbers can be subtracted");
            return -x;
        } else if (arguments.length === 2) {
            return x - y;
        } else {
            var i,
                sum = arguments[0] - arguments[1];
            for (i = 2; i < arguments.length; i++) {
                sum -= 1 * arguments[i];
            }
            return sum;
        }
    };
    define(ZERA_NS, "-", sub);

    var mult = function (x) {
        if (arguments.length === 0) {
            return 1;
        } else if (x == null) return null;
        else if (arguments.length === 1) {
            if (!isNumber(x)) throw new Error("Only numbers can be multiplied");
            return x;
        } else {
            var sum = 1;
            var i;
            for (i = 0; i < arguments.length; i++) {
                sum *= num(arguments[i]);
            }
            return sum;
        }
    };
    define(ZERA_NS, "*", mult);

    var div = function (x) {
        if (arguments.length === 0) {
            throw new Error(
                str(
                    "Wrong number of arguments expected 1 or more, got: ",
                    arguments.length
                )
            );
        } else if (arguments.length === 1) {
            if (!isNumber(x)) throw new Error("Only numbers can be multiplied");
            return 1 / x;
        } else {
            var sum = 1;
            var i;
            for (i = 0; i < arguments.length; i++) {
                sum /= num(arguments[i]);
            }
            return sum;
        }
    };
    define(ZERA_NS, "/", div);

    function symbolImporter(ns) {
        return function (name) {
            try {
                var val = eval(name);
                if (val != null) {
                    define(ns, name, val);
                }
            } catch (e) {
                //console.error(e);
            }
        };
    }

    define(ZERA_NS, "*platform*", Keyword.intern("js"));

    var JS_NS = Namespace.findOrCreate(Sym.intern("js"));
    define(JS_NS, "function?", isJSFn);
    define(JS_NS, "object->map", objectToMap);

    // import js stuff
    [
        "Array",
        "ArrayBuffer",
        "AsyncFunction",
        "Atomics",
        "Boolean",
        "DataView",
        "Date",
        "Error",
        "EvalError",
        "Float32Array",
        "Float64Array",
        "Function",
        "Generator",
        "GeneratorFunction",
        "Infinity",
        "Int32Array",
        "Int64Array",
        "Int8Array",
        "InternalError",
        "Intl",
        "JSON",
        "Map",
        "Math",
        "NaN",
        "Number",
        "Object",
        "Promise",
        "Proxy",
        "RangeError",
        "ReferenceError",
        "Reflect",
        "RegExp",
        "Set",
        "String",
        "Symbol",
        "SyntaxError",
        "TypeError",
        "TypedArray",
        "URIError",
        "Uint16Array",
        "Uint32Array",
        "Uint8Array",
        "Uint8ClampedArray",
        "WeakMap",
        "WeakSet",
        "decodeURI",
        "decodeURIComponent",
        "encodeURI",
        "encodeURIComponent",
        "eval",
        "isFinite",
        "isNaN",
        "parseFloat",
        "parseInt",
        "uneval",
        "SIMD",
        "WebAssembly",
        "window",
        "document",
        "navigator",
        "location",
        "localStorage",
        "console",
        "setInterval",
        "setTimeout",
        "clearInterval",
        "clearTimeout",
    ].forEach(symbolImporter(JS_NS));

    if (isBrowser) {
        var DOM_NS = Namespace.findOrCreate(Sym.intern("js.dom"));
        define(ZERA_NS, "*platform*", Keyword.intern("js/browser"));
        define(
            ZERA_NS,
            "*platform-info*",
            arrayMap(
                Keyword.intern("platform/name"),
                navigator.userAgent,
                Keyword.intern("platform/version"),
                navigator.userAgent
            )
        );
        [
            "Attr",
            "ByteString",
            "CDATASection",
            "CharacterData",
            "ChildNode",
            "CSSPrimitiveValue",
            "CSSValue",
            "CSSValueList",
            "Comment",
            "CustomEvent",
            "Document",
            "DocumentFragment",
            "DocumentType",
            "DOMError",
            "DOMException",
            "DOMImplmentation",
            "DOMString",
            "DOMTimeStamp",
            "DOMStringList",
            "DOMTokenList",
            "Element",
            "Event",
            "EventTarget",
            "MutationObserver",
            "MutationRecord",
            "Node",
            "NodeFilter",
            "NodeIterator",
            "NodeList",
            "ParentNode",
            "ProcessingInstruction",
            "Range",
            "Text",
            "TreeWalker",
            "URL",
            "Window",
            "Worker",
            "XMLDocument",
            "HTMLAnchorElement",
            "HTMLAreaElement",
            "HTMLAudioElement",
            "HTMLBaseElement",
            "HTMLBodyElement",
            "HTMLBREElement",
            "HTMLButtonElement",
            "HTMLCanvasElement",
            "HTMLDataElement",
            "HTMLDataListElement",
            "HTMLDialogElement",
            "HTMLDivElement",
            "HTMLDListElement",
            "HTMLEmbedElement",
            "HTMLFieldSetElement",
            "HTMLFontElement",
            "HTMLFormElement",
            "HTMLFrameSetElement",
            "HTMLHeadElement",
            "HTMLHtmlElement",
            "HTMLHRElement",
            "HTMLIFrameElement",
            "HTMLImageElement",
            "HTMLInputElement",
            "HTMLKeygenElement",
            "HTMLLabelElement",
            "HTMLLIElement",
            "HTMLLinkElement",
            "HTMLMapElement",
            "HTMLMediaElement",
            "HTMLMetaElement",
            "HTMLMeterElement",
            "HTMLModElement",
            "HTMLObjectElement",
            "HTMLOListElement",
            "HTMLOptGroupElement",
            "HTMLOptionElement",
            "HTMLOutputElement",
            "HTMLParagraphElement",
            "HTMLParamElement",
            "HTMLPreElement",
            "HTMLProgressElement",
            "HTMLQuoteElement",
            "HTMLScriptElement",
            "HTMLSelectElement",
            "HTMLSourceElement",
            "HTMLSpanElement",
            "HTMLStyleElement",
            "HTMLTableElement",
            "HTMLTableCaptionElement",
            "HTMLTableCellElement",
            "HTMLTableDataCellElement",
            "HTMLTableHeaderCellElement",
            "HTMLTableColElement",
            "HTMLTableRowElement",
            "HTMLTableSectionElement",
            "HTMLTextAreaElement",
            "HTMLTimeElement",
            "HTMLTitleElement",
            "HTMLTrackElement",
            "HTMLUListElement",
            "HTMLUnknownElement",
            "HTMLVideoElement",
            "CanvasRenderingContext2D",
            "CanvasGradient",
            "CanvasPattern",
            "TextMetrics",
            "ImageData",
            "CanvasPixelArray",
            "NotifyAudioAvailableEvent",
            "HTMLFormControlsCollection",
            "HTMLOptionsCollection",
            "DOMStringMap",
            "RadioNodeList",
            "MediaError",
        ].forEach(symbolImporter(DOM_NS));
    }

    if (isNode) {
        var NODE_NS = Namespace.findOrCreate(Sym.intern("js.node"));
        define(ZERA_NS, "*platform*", Keyword.intern("js/node"));
        define(
            ZERA_NS,
            "*platform-info*",
            arrayMap(
                Keyword.intern("platform/name"),
                "node",
                Keyword.intern("platform/version"),
                process.version
            )
        );
        [
            "Buffer",
            "__dirname",
            "__filename",
            "clearImmediate",
            "console",
            "exports",
            "global",
            "process",
            "setImmediate",
            "require",
        ].forEach(symbolImporter(NODE_NS));
    }

    function evalString(s) {
        var r = new PushBackReader(s);
        var res, ret;
        while (true) {
            res = read(r, { eofIsError: false, eofValue: null });
            if (res != null) {
                ret = evaluate(res);
            }
            if (res == null) return ret;
        }
    }

    function compileString(s) {
        var r = new PushBackReader(s);
        var res,
            ret,
            buff = [],
            cEnv = env();
        while (true) {
            res = read(r, { eofIsError: false, eofValue: null });
            if (res != null) {
                ret = compile(res, cEnv);
                if (ret != null) buff.push(ret);
            }
            if (res == null) break;
        }
        return buff.join(";\n");
    }

    var api = {
        lang: {
            IMeta: IMeta,
            IObj: IObj,
            AFn: AFn,
            Fn: Fn,
            AReference: AReference,
            ARef: ARef,
            Named: Named,
            Symbol: Sym,
            Keyword: Keyword,
            Seq: Seq,
            List: List,
            Cons: Cons,
            LazySeq: LazySeq,
            MapEntry: MapEntry,
            AMap: AMap,
            ArrayMap: ArrayMap,
            ASet: ASet,
            APersistentSet: APersistentSet,
            HashSet: HashSet,
            Var: Var,
            Namespace: Namespace,
            RecursionPoint: RecursionPoint,
            ZeraError: ZeraError,
            env: env,
        },
        reader: {
            PushBackReader: PushBackReader,
            readString: readString,
        },
        core: ZERA_NS.toJSModule(),
        JS_GLOBAL_OBJECT: JS_GLOBAL_OBJECT,
        CURRENT_NS: CURRENT_NS,
        evalJS: evalJS,
        evalJSON: evalJSON,
        readJS: readJS,
        readJSON: readJSON,
        readString: readString,
        evalString: evalString,
    };

    if (isNode) {
        var fs = require("fs");

        api.loadJSONFile = function (file) {
            var ret = null;
            JSON.parse(fs.readFileSync(file).toString()).forEach(function (
                line
            ) {
                ret = evalJS(line);
            });
            return ret;
        };

        api.loadFile = function (file) {
            return evalString(fs.readFileSync(file).toString());
        };

        api.compileFile = function (file) {
            return compileString(fs.readFileSync(file).toString());
        };

        define(ZERA_NS, "load-file", api.loadFile);

        global.zera = api;

        module.exports = api;
    }

    return api;
})();
