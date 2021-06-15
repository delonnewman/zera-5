// jshint esversion: 5
// jshint eqnull: true
// jshint evil: true

var zera = (function () {
    "use strict";

    var isNode =
        typeof module !== "undefined" && typeof module.exports !== "undefined";
    var isBrowser = typeof window !== "undefined";

    function evalQuote(form) {
        return car(cdr(form));
    }

    var symN = atom(1);
    var incSym = function (x) {
        return x + 1;
    };

    function gensym(prefix) {
        if (prefix == null) var prefix = "G__";
        var s = Sym.intern([prefix, symN.deref()].join(""));
        symN.swap(incSym);
        return s;
    }

    var ZERA_NS = Namespace.findOrCreate(Sym.intern("zera.core"));
    var CURRENT_NS = Var.intern(
        ZERA_NS,
        Sym.intern("*ns*"),
        ZERA_NS
    ).setDynamic();

    function env(parent) {
        if (parent) {
            return {
                vars: { "*ns*": parent.vars["*ns*"] || CURRENT_NS.get() },
                parent: parent,
            };
        } else {
            return {
                vars: {},
                parent: null,
            };
        }
    }

    function isEnv(x) {
        return x != null && x.vars !== void 0;
    }

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

    function findVar(sym, returnNull) {
        var ERROR_UNDEFINED_VAR = new Error(str("Undefined variable: ", sym));
        var ns,
            v,
            scope,
            name = sym.name();
        if (sym.isQualified()) {
            ns = CURRENT_NS.get().lookupAlias(sym.namespace());
            ns = ns == null ? Namespace.findOrDie(sym.namespace()) : ns;
            v = ns.mapping(name);
            if (!v) {
                if (!returnNull) throw ERROR_UNDEFINED_VAR;
                return null;
            }
            return v;
        } else {
            v = CURRENT_NS.get().mapping(name);
            if (v) return v;
            else {
                v = ZERA_NS.mapping(name);
                if (v) return v;
                if (returnNull) return null;
                throw ERROR_UNDEFINED_VAR;
            }
        }
    }

    // 1) if namespace-qualified lookup in namespace
    // 2) lookup in lexical scope
    // 3) lookup in current namespace
    // 4) lookup in default namespace
    // (could go back and put default imports in top then they'll always be found lexically unless they've been redefined and should be more performant)
    function evalSymbol(sym, env) {
        var MACRO_ERROR = str("Macros cannot be evaluated in this context");
        var ns,
            v,
            scope,
            name = sym.name();
        // 1) namespace-qualified
        if (sym.isQualified()) {
            ns = CURRENT_NS.get().lookupAlias(sym.namespace());
            ns = ns == null ? Namespace.findOrDie(sym.namespace()) : ns;
            v = ns.mapping(name);
            if (!v) throw new Error(str("Undefined variable: ", sym));
            if (v.isMacro()) throw new Error(MACRO_ERROR);
            return v.get();
        } else {
            // 2) lookup in lexical environment
            scope = lookup(env, name);
            if (scope != null) {
                return scope.vars[name];
            } else {
                // 3) lookup in scoped namespace
                ns = env.vars["*ns*"];
                v = ns && ns.mapping(name);
                if (v) {
                    if (v.isMacro()) {
                        prn(v);
                        throw new Error(MACRO_ERROR);
                    }
                    return v.get();
                } else {
                    // 4) lookup in current namespace
                    v = CURRENT_NS.get().mapping(name);
                    if (v) {
                        if (v.isMacro()) {
                            prn(v);
                            throw new Error(MACRO_ERROR);
                        }
                        return v.get();
                    } else {
                        // 5) lookup in default namespace
                        v = ZERA_NS.mapping(name);
                        if (v) {
                            if (v.isMacro()) throw new Error(MACRO_ERROR);
                            return v.get();
                        }
                        throw new Error(str("Undefined variable: ", sym));
                    }
                }
            }
        }
    }

    function set(env, name, value) {
        if (!name.isQualified()) {
            var scope = lookup(env, name);
            if (scope) {
                scope.vars[name] = value;
                return scope.vars[name];
            }
        }
        var v = findVar(name);
        return v.set(value);
    }

    function evalLetBlock(form, env_) {
        pt('let', form);
        var rest = cdr(form);
        var binds = car(rest);
        var body = cdr(rest);
        var scope = env(env_);

        if (!isVector(binds) && count(binds) % 2 === 0) {
            throw new Error(
                "Bindings should be a vector with an even number of elements"
            );
        }
        binds = binds.toArray();

        var i, name, sname;
        for (i = 0; i < binds.length; i += 2) {
            name = binds[i];
            sname = str(name);
            if (sname.endsWith("#")) {
                name = gensym(str(sname.slice(0, sname.length - 1)));
            }
            defineLexically(scope, name);
            defineLexically(scope, name, evaluate(binds[i + 1], scope));
        }

        var x = car(body),
            xs = body.rest(),
            ret;
        while (x != null) {
            ret = evaluate(x, scope);
            x = xs.first();
            xs = xs.rest();
        }
        return ret;
    }

    function evalDefinition(form, env) {
        var rest = cdr(form);
        var name = car(rest);
        var value = car(cdr(rest));
        var ns = CURRENT_NS.get();
        if (name.isQualified()) {
            if (name.namespace() !== str(ns.name())) {
                throw new Error(
                    "Cannot define var in a namespace other than the current namespace"
                );
            }
            name = Sym.intern(name.name());
        }
        return Var.intern(ns, name, evaluate(value, env));
    }

    // TODO: make sure works with JS interop
    function evalAssignment(form, env) {
        var rest = cdr(form);
        var name = car(rest);
        var value = car(cdr(rest));
        if (name == null || value == null)
            throw new Error(
                "Malformed assignment expecting: (set! target value)"
            );
        return set(env, name, evaluate(value, env));
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

    function pair(xs) {
        if (isNil(xs)) {
            return Vector.EMPTY;
        } else if (count(xs) === 1) {
            return xs;
        } else {
            var xs_ = xs,
                x = first(xs_),
                y = first(rest(xs_)),
                v = Vector.EMPTY;
            while (xs_ !== null) {
                v = v.conj(vector(x, y));
                xs_ = next(rest(xs_));
                x = first(xs_);
                y = first(rest(xs_));
            }
            return v;
        }
    }

    function objectToMap(obj, keyFn) {
        var keyFn_ = keyFn || keyword;
        if (obj == null) return ArrayMap.EMPTY;
        var keys = Object.getOwnPropertyNames(obj);
        if (keys.length === 0) return null;
        var i,
            entries = [];
        for (i = 0; i < keys.length; i++) {
            entries.push(apply(keyFn_, [keys[i]]));
            entries.push(obj[keys[i]]);
        }
        return new ArrayMap(null, entries);
    }

    function evalConditional(form, env) {
        var preds = cdr(form);
        if (count(preds) % 2 !== 0) {
            throw new Error(
                str(
                    "cond requires an even number of predicates: ",
                    prnStr(form)
                )
            );
        }
        var i = 1,
            x,
            y,
            rest,
            xs = preds;
        while (i < count(preds)) {
            rest = cdr(xs);
            x = car(xs);
            y = car(rest);
            if (x === "else") {
                return evaluate(y, env);
            } else {
                x = evaluate(x, env);
                if (!isNil(x) && x !== false) {
                    return evaluate(y, env);
                }
            }
            xs = cdr(rest);
            i++;
        }
        return null;
    }

    function isFn(x) {
        return x instanceof Fn;
    }

    function isFunction(x) {
        return isFn(x) || isJSFn(x);
    }

    function isInvocable(x) {
        //if (x == null) return false;
        return isJSFn(x.apply);
    }

    function evalApplication(form, env, stack) {
        console.log('form', prnStr(form));
        var stack_ = conj(stack, car(form));
        var fn = evaluate(car(form), env, stack_);
        console.log('fn', fn);
        var args = cdr(form);
        console.log('args', prnStr(args));
        var args_ = map((x) => evaluate(x, env, stack_), args);
        console.log('args_', prnStr(args_));
        return apply(fn, args_);
    }

    // TODO: add destructuring
    // TODO: add variable validation, capture variable values from environment
    // TODO: add recur support
    // (fn ([x] x)
    //     ([x & xs] (cons x xs)))
    function evalFunction(form, env_, isMethod) {
        var xs = cdr(form),
            names = car(xs),
            body = cdr(xs);
        if (isList(names)) {
            var arglists = mapA(first, xs),
                bodies = mapA(rest, xs),
                arglists_ = {},
                bodies_ = {};
            for (var i = 0; i < arglists.length; i++) {
                if (!isVector(arglists[i])) {
                    throw new Error(
                        "A multi-body function should have a body of lists where the first element is a vector, got: " +
                            prnStr(form)
                    );
                }
                var arglist = arglists[i].toArray();
                var arity = calculateArity(arglist);
                arglists_[arity] = arglist;
                bodies_[arity] = bodies[i];
            }
            return new Fn(form.meta(), env(env_), arglists_, bodies_, isMethod);
        } else if (isVector(names)) {
            return new Fn(
                form.meta(),
                env(env_),
                [names.toArray()],
                [body],
                isMethod
            );
        }
        throw new Error(
            str(
                "function arguments should be a vector or a list of vectors, got: ",
                prnStr(form)
            )
        );
    }

    function evalMacroDefinition(form) {
        var rest = cdr(form),
            name = car(rest),
            fnrest = cdr(rest),
            form_ = cons(FN_SYM, fnrest).withMeta(
                arrayMap(keyword("macro"), true)
            );
        var val = evalFunction(form_);
        return Var.intern(CURRENT_NS.get(), name, val).setMacro();
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

    function evalRecursionPoint(form, env) {
        var args = mapA(function (x) {
            return evaluate(x, env);
        }, cdr(form));
        throw new RecursionPoint(args);
    }

    function evalLoop(form, env_) {
        var binds = car(cdr(form));
        var body = cdr(cdr(form));
        var scope = env(env_);
        var ret = null;

        if (count(binds) % 2 !== 0) {
            throw new Error("loop requires an even number of bindings");
        }

        // bind variables & collect names
        var i;
        var binds_ = intoArray(binds);
        var names = [],
            name,
            value,
            evaled;
        for (i = 0; i < binds_.length; i += 2) {
            name = binds_[i];
            value = binds_[i + 1];
            names.push(name);
            evaled = evaluate(value, scope);
            defineLexically(scope, name);
            defineLexically(scope, name, evaled);
        }

        loop: while (true) {
            try {
                // evaluate body
                var exp = car(body),
                    exprs = cdr(body);
                while (exp != null) {
                    ret = evaluate(exp, scope);
                    exp = car(exprs);
                    exprs = cdr(exprs);
                }
                break;
            } catch (e) {
                //p(e.args);
                if (e instanceof RecursionPoint) {
                    if (names.length !== e.args.length) {
                        throw new Error(
                            str(
                                "Wrong number or arguments, expected: ",
                                names.length,
                                " got: ",
                                e.args.length
                            )
                        );
                    }
                    for (i = 0; i < names.length; i++) {
                        defineLexically(scope, names[i], e.args[i]);
                    }
                    continue loop;
                } else {
                    throw e;
                }
            }
        }
        return ret;
    }

    function evalClassInstantiation(form, env) {
        var ctr = evaluate(car(cdr(form)), env);
        if (ctr.$zera$isProtocol === true)
            throw new Error("Protocols cannot be instantiated");
        if (!isJSFn(ctr))
            throw new Error("class given is not a valid constructor");
        var args = mapA(function (x) {
            return evaluate(x, env);
        }, cdr(cdr(form)));
        return new (ctr.bind.apply(ctr, [].concat(ctr, args)))();
    }

    // member access
    // (. obj member)
    // (. obj symbol)
    // (. obj -symbol)
    // (. obj (symbol *args))
    // (. obj (-symbol))
    function evalMemberAccess(form, env) {
        var obj = evaluate(car(cdr(form)), env);
        var member = car(cdr(cdr(form)));
        var val;
        if (isSymbol(member)) {
            var smember = member.toString();
            val = obj[smember];
            if (smember.startsWith("-")) {
                return obj[smember.slice(1)];
            } else if (isJSFn(val)) {
                return val.call(obj);
            } else {
                return val;
            }
        } else if (isList(member)) {
            var name = str(car(member));
            val = obj[name];
            if (name.startsWith("-")) {
                return obj[name.slice(1)];
            } else if (isJSFn(val)) {
                var args = mapA(function (x) {
                    return evaluate(x, env);
                }, cdr(member));
                return val.apply(obj, args);
            } else {
                throw new Error(
                    str('invalid member access: "', prnStr(form), '"')
                );
            }
        } else {
            throw new Error(str('invalid member access: "', prnStr(form), '"'));
        }
    }

    function evalThrownException(form, env) {
        var exp = evaluate(car(cdr(form)), env);
        throw exp;
    }

    function evalVar(form, env) {
        var exp = car(cdr(form));
        if (!isSymbol(exp))
            throw new Error("Var name should be a Symbol, got: " + prnStr(exp));
        if (!exp.namespace())
            throw new Error("Var name should be fully qualified");
        var ns = Namespace.findOrDie(exp.namespace());
        return ns.findInternedVar(exp.name());
    }

    function evalDoBlock(form, env) {
        var x = first(rest(form)),
            xs = rest(rest(form)),
            ret;
        while (x != null) {
            ret = evaluate(x, env);
            x = xs.first();
            xs = xs.rest();
        }
        return ret;
    }

    function evalArray(form, env) {
        return form.map(function (x) {
            return evaluate(x, env);
        });
    }

    function evalVector(form, env) {
        return new Vector(form.meta(), evalArray(form.toArray(), env));
    }

    // TODO: add a toTrasient method to all Seq's
    function into(to, from) {
        while (first(from) != null) {
            to = conj(to, first(from));
            from = rest(from);
        }
        return to;
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

    function isSelfEvaluating(form) {
        return isAtomic(form) || isJSFn(form);
    }

    var top = env();
    var MSG_KEY = keyword("msg");
    var FN_KEY = keyword("fn");
    var FILE_KEY = keyword("file");
    var LINE_KEY = keyword("line");

    function ZeraError(msg, stack, parent) {
        this.msg = msg;
        this.stack = stack;
        this.parent = parent;
    }

    // TODO: add try, catch, finally
    function evaluate(form_, env_, stack_) {
        var stack, env, recur, ret, form;
        try {
            stack = stack_ || vector();
            env = env_ || top;
            recur = true;
            ret = null;
            form = macroexpand(form_, env_, stack);
            while (recur) {
                recur = false;
                if (form == null || NIL_SYM.equals(form)) {
                    ret = null;
                } else if (isSelfEvaluating(form)) {
                    ret = form;
                } else if (isMap(form)) {
                    ret = evalMap(form, env);
                } else if (isVector(form)) {
                    ret = evalVector(form, env);
                } else if (isArray(form)) {
                    ret = evalArray(form, env);
                } else if (isSet(form)) {
                    ret = evalSet(form, env);
                } else if (isSymbol(form)) {
                    ret = evalSymbol(form, env);
                } else if (isList(form)) {
                    if (isEmpty(form)) return form;
                    var tag = str(car(form));
                    switch (tag) {
                        case "quote":
                            ret = evalQuote(form);
                            break;
                        case "do":
                            ret = evalDoBlock(form, env);
                            break;
                        case "let":
                            ret = evalLetBlock(form, env);
                            break;
                        case "def":
                            ret = evalDefinition(form, env);
                            break;
                        case "var":
                            ret = evalVar(form, env);
                            break;
                        case "set!":
                            ret = evalAssignment(form, env);
                            break;
                        case "cond":
                            ret = evalConditional(form, env);
                            break;
                        case "fn":
                            ret = evalFunction(form, env);
                            break;
                        case "loop":
                            ret = evalLoop(form, env);
                            break;
                        case "recur":
                            ret = evalRecursionPoint(form, env);
                            break;
                        case "throw":
                            ret = evalThrownException(form, env);
                            break;
                        case "new":
                            ret = evalClassInstantiation(form, env);
                            break;
                        case ".":
                            ret = evalMemberAccess(form, env);
                            break;
                        case "defmacro":
                            ret = evalMacroDefinition(form, env);
                            break;
                        default:
                            ret = evalApplication(form, env, stack);
                            break;
                    }
                } else {
                    console.error("Invalid form", form);
                    throw new Error(str('invalid form: "', form, '"'));
                }
            }
            return ret;
        } catch (e) {
            if (e instanceof ZeraError) {
                throw new ZeraError(e.msg, e.stack, e.parent);
            } else if (isError(e)) {
                throw new ZeraError(e.message, intoArray(stack), e);
            } else if (isString(e)) {
                throw new ZeraError(e, intoArray(stack), new Error(e));
            } else {
                throw e;
            }
        }
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

    function alast(a) {
        if (a.length === 0) return null;
        else if (a.length === 1) return a[0];
        else {
            return a[a.length - 1];
        }
    }

    function ahead(a) {
        if (a.length === 0 || a.length === 1) return [];
        else {
            return a.slice(0, a.length - 1);
        }
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

    var names = {
        "=": "eq",
        "not=": "noteq",
        "<": "lt",
        ">": "gt",
        "<=": "lteq",
        ">=": "gteq",
        "+": "add",
        "-": "sub",
        "*": "mult",
        "/": "div",
    };

    function zeraNameToJS(x) {
        if (names[x]) return names[x];
        var prefix = null,
            parts;
        if (x.endsWith("?")) {
            prefix = "is";
            x = x.slice(0, x.length - 1);
        } else if (x.endsWith("!")) {
            x = x.slice(0, x.length - 1);
        } else if (x.startsWith("*") && x.endsWith("*")) {
            return x
                .slice(0, x.length - 1)
                .slice(1)
                .split("-")
                .map(function (s) {
                    return s.toUpperCase();
                })
                .join("_");
        }
        if (x.indexOf("->") !== -1)
            parts = x.split("->").reduce(function (a, x) {
                return [].concat(a, "to", x);
            });
        else parts = prefix ? [].concat(prefix, x.split("-")) : x.split("-");
        return [].concat(parts[0], parts.slice(1).map(cap)).join("");
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

    //
    // Reader
    //

    function PushBackReader(str) {
        this.limit = str.length - 1;
        this.stream = str.split("");
        this.position = 0;
        this._line = 1;
        this._column = 1;
    }

    PushBackReader.prototype.line = function () {
        return this._line;
    };

    PushBackReader.prototype.column = function () {
        return this._column;
    };

    PushBackReader.prototype.read = function () {
        if (this.position > this.limit) return null;
        var ch = this.stream[this.position];
        this.position++;
        if (ch === "\n") {
            this._column = 1;
            this._line++;
        } else {
            this._column++;
        }
        return ch;
    };

    PushBackReader.prototype.skip = function (n) {
        this.position += n;
    };

    PushBackReader.prototype.reset = function () {
        this.position = 0;
    };

    PushBackReader.prototype.unread = function (ch) {
        this.position -= 1;
        this.stream[this.position] = ch;
    };

    function stringReader(r, doublequote, opts) {
        var buff = [];

        var ch;
        for (ch = r.read(); ch !== '"'; ch = r.read()) {
            if (ch === null) throw new Error("EOF while reading string");
            if (ch === "\\") {
                // escape
                ch = r.read();
                if (ch === null) throw new Error("EOF while reading string");
                switch (ch) {
                    case "t":
                        ch = "\t";
                        break;
                    case "r":
                        ch = "\r";
                        break;
                    case "n":
                        ch = "\n";
                        break;
                    case "\\":
                        break;
                    case '"':
                        break;
                    case "b":
                        ch = "\b";
                        break;
                    case "f":
                        ch = "\f";
                        break;
                    case "u":
                        // TODO: add Unicode support
                        throw new Error("Don't know how to read unicode yet");
                    default:
                        // TODO: complete this
                        throw new Error("Unsupported escape character: " + ch);
                }
            }
            buff.push(ch);
        }
        return buff.join("");
    }

    function commentReader(r, semicolon, opts) {
        var ch;
        do {
            ch = r.read();
        } while (ch !== null && ch !== "\n" && ch !== "\r");
        return r;
    }

    function readDelimitedList(delim, r, isRecursive, opts) {
        var firstline = r.line();
        var a = [];

        while (true) {
            var ch = r.read();
            while (isWhitespace(ch)) ch = r.read();

            if (ch === null) {
                throw new Error(
                    "EOF while reading, starting at line: " + firstline
                );
            }

            if (ch === delim) break;

            var macrofn = getMacro(ch);
            if (macrofn !== null) {
                var ret = macrofn.call(null, r, ch, opts);
                // no op macros return the reader
                if (ret !== r) a.push(ret);
            } else {
                r.unread(ch);
                var x = read(r, true, null, isRecursive, opts);
                if (x !== r) a.push(x);
            }
        }

        return a;
    }

    function listReader(r, openparen, opts) {
        var meta = arrayMap(
            Keyword.intern("line"),
            r.line(),
            Keyword.intern("column"),
            r.column()
        );
        var a = readDelimitedList(")", r, true, opts);
        return list.apply(null, a).withMeta(meta);
    }

    function unmatchedDelimiterReader(r, delim, opts) {
        throw new Error("Unmatched delimiter: " + delim);
    }

    function vectorReader(r, openbracket, opts) {
        var a = readDelimitedList("]", r, true, opts);
        return new Vector(null, a);
    }

    function mapReader(r, openbracket, opts) {
        var a = readDelimitedList("}", r, true, opts);
        return arrayMap.apply(null, a);
    }

    function characterReader(r, slash, opts) {
        var ch = r.read();
        if (ch === null) throw new Error("EOF while reading character");
        var token = readToken(r, ch, false);
        if (token.length === 1) return token;
        else if (token === "newline") return "\n";
        else if (token === "space") return " ";
        else if (token === "tab") return "\t";
        else if (token === "backspace") return "\b";
        else if (token === "formfeed") return "\f";
        else if (token === "return") return "\r";
        else if (token.startsWith("u")) {
            throw new Error("Don't know how to read unicode characters");
        } else if (token.startsWith("o")) {
            throw new Error("Don't know how to read octal characters");
        }
    }

    var TAG_KEY = Keyword.intern("tag");
    var LINE_KEY = Keyword.intern("line");
    var COLUMN_KEY = Keyword.intern("colunm");

    function metaReader(r, hat, opts) {
        var line = r.line();
        var column = r.column();
        var meta = _read(r, true, null, true, opts);
        // FIXME: we probably don't have any use for tags
        if (isSymbol(meta) || isString(meta)) {
            meta = arrayMap(TAG_KEY, meta);
        } else if (isKeyword(meta)) {
            meta = arrayMap(meta, true);
        } else if (!isMap(meta)) {
            throw new Error(
                "Metadata must be a Symbol, Keyword, String or Map"
            );
        }

        var x = _read(r, true, null, true, opts);
        if (isa(x, IMeta)) {
            if (isSeq(x)) {
                meta = meta.assoc([LINE_KEY, line, COLUMN_KEY, column]);
            }
            if (isa(x, AReference)) {
                x.resetMeta(meta);
                return x;
            }

            var xmeta = x.meta();
            for (var s = meta.entries(); s !== null; s = s.next()) {
                var kv = s.first();
                xmeta = xmeta.assoc([key(kv), val(kv)]);
            }
            return x.withMeta(xmeta);
        } else {
            throw new Error("Metadata can only be applied to IMetas");
        }
    }

    function dispatchReader(r, hash, opts) {
        var ch = r.read();
        if (ch === null) throw new Error("EOF while reading character");
        var fn = DISPATCH_MACROS[ch];

        if (fn == null) {
            // TODO: implement taggedReader
            /*if (ch.match(/[A-Za-z]{1,1}/)) {
                r.unread(ch);
                return taggedReader.call(null, ch, opts);
            }*/
            throw new Error("No dispatch macro for: " + ch);
        }
        return fn.call(null, r, ch, opts);
    }

    function wrappingReader(sym) {
        return function (r, quote, opts) {
            var x = _read(r, true, null, true, opts);
            return list(sym, x);
        };
    }

    function varReader(r, quote, opts) {
        var x = _read(r, true, null, true, opts);
        return list(THE_VAR, x);
    }

    function setReader(r, leftbracket, opts) {
        return HashSet.createFromArray(readDelimitedList("}", r, true, opts));
    }

    var MACROS = {
        '"': stringReader,
        ";": commentReader,
        "'": wrappingReader(QUOTE_SYM),
        "@": wrappingReader(DEREF_SYM),
        "^": metaReader,
        "(": listReader,
        ")": unmatchedDelimiterReader,
        "[": vectorReader,
        "]": unmatchedDelimiterReader,
        "{": mapReader,
        "}": unmatchedDelimiterReader,
        "\\": characterReader,
        "#": dispatchReader,
    };

    // TODO: implement dispatch macros
    var DISPATCH_MACROS = {
        "^": metaReader,
        "'": varReader,
        "{": setReader,
    };

    function isWhitespace(ch) {
        if (ch == null) return false;
        return ch === "," || ch.match(/^\s$/);
    }

    function isDigit(ch) {
        return ch.match(/^\d$/);
    }

    function isMacro(ch) {
        return !!MACROS[ch];
    }

    function isTerminatingMacro(ch) {
        return ch !== "#" && ch !== "'" && isMacro(ch);
    }

    function getMacro(ch) {
        var m = MACROS[ch];
        if (m != null) return m;
        return null;
    }

    function readString(str) {
        var r = new PushBackReader(str);
        var res, ret;
        while (true) {
            res = read(r, { eofIsError: false, eofValue: { $zera$eof: true } });
            if (res.$zera$eof !== true) ret = res;
            if (res.$zera$eof === true) return ret;
        }
        return ret;
    }

    function readNumber(r, initch) {
        var buff = [initch];

        while (true) {
            var ch = r.read();
            if (ch === null || isWhitespace(ch) || isMacro(ch)) {
                r.unread(ch);
                break;
            }
            buff.push(ch);
        }

        var s = buff.join("");
        var n = matchNumber(s);
        if (n === null) throw new Error("Invalid number: " + s);
        return n;
    }

    // TODO: add decimals, _'s, scientific notation, rationals?
    function matchNumber(s) {
        var m = s.match(/(\-|\+)?\d+/);
        if (m !== null) {
            return 1 * s;
        }
        return null;
    }

    function nonConstituent(ch) {
        return ch === "@" || ch === "`" || ch === "~";
    }

    function readToken(r, initch, leadConstituent) {
        if (leadConstituent && nonConstituent(initch)) {
            throw new Error("Invalid leading character: " + initch);
        }

        var buff = [initch];
        while (true) {
            var ch = r.read();
            if (ch === null || isWhitespace(ch) || isTerminatingMacro(ch)) {
                r.unread(ch);
                return buff.join("");
            } else if (nonConstituent(ch)) {
                throw new Error("Invalid constituent character: " + ch);
            }
            buff.push(ch);
        }
    }

    function matchSymbol(s) {
        if (s.charAt(0) === ":") {
            return Keyword.intern(Sym.intern(s.substring(1)));
        } else if (s.endsWith("#")) {
            return Sym.intern(s).withMeta(arrayMap(keyword("autosym"), true));
        }
        return Sym.intern(s);
    }

    function interpretToken(s) {
        if (s === "nil") {
            return null;
        } else if (s === "true") {
            return true;
        } else if (s === "false") {
            return false;
        }

        var ret = matchSymbol(s);
        if (ret !== null) return ret;
        throw new Error("Invalid token: " + s);
    }

    function read(r, opts) {
        var eofIsError = true;
        var eofValue = null;
        if (opts != null) {
            eofIsError = opts.eofIsError;
            eofValue = opts.eofValue;
        }
        return _read(r, eofIsError, eofValue, false, opts);
    }

    function _read(r, eofIsError, eofValue, isRecursive, opts) {
        while (true) {
            var ch = r.read();

            while (isWhitespace(ch)) ch = r.read();
            if (ch === null) {
                if (eofIsError) throw new Error("EOF while reading");
                return eofValue;
            }

            if (isDigit(ch)) {
                var n = readNumber(r, ch);
                return n;
            }

            var macrofn = getMacro(ch);
            if (macrofn !== null) {
                var ret = macrofn.call(null, r, ch, opts);
                if (ret === r) continue;
                return ret;
            }

            if (ch === "+" || ch === "-") {
                var ch2 = r.read();
                if (isDigit(ch2)) {
                    r.unread(ch2);
                    return readNumber(r, ch);
                }
                r.unread(ch2);
            }

            var token = readToken(r, ch, true);
            return interpretToken(token);
        }
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
