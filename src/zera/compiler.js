// jshint esversion: 6
// jshint eqnull: true
// jshint evil: true
JSGLOBAL = typeof module !== 'undefined' ? global : window;
JSGLOBAL.wonderscript = JSGLOBAL.wonderscript || {};
JSGLOBAL.wonderscript.compiler = function() {
    "use strict";

    const IS_NODE = typeof module !== 'undefined' ? true : false;
    const IS_BROWSER = typeof window !== 'undefined' ? true : false;

    var core, edn;
    if (IS_NODE) {
        core = require('./core.js');
        edn = require('./edn.js');
    }

    if (IS_BROWSER) {
        core = wonderscript.core;
        edn = wonderscript.edn;
    }

    const {
        str,
        map,
        reduce,
        partition,
        cons,
        first,
        next,
        rest,
        isObject,
        isObjectLiteral,
        isNull,
        isString,
        isFunction,
        isNumber,
        isBoolean,
        isUndefined,
        isArray,
        isArrayLike,
        print,
        isEmpty,
        createNs,
        setMeta,
        getMeta,
        meta
    } = core;

    const { read, PushBackReader } = edn;

    const QUOTE_SYM   = 'quote';
    const DEF_SYM     = 'def';
    const COND_SYM    = 'cond';
    const JS_SYM      = 'js*';
    const FN_SYM      = 'fn*';
    const LOOP_SYM    = 'loop';
    const RECUR_SYM   = 'recur';
    const THROW_SYM   = 'throw';
    const TRY_SYM     = 'try';
    const CATCH_SYM   = 'catch';
    const FINALLY_SYM = 'finally';
    const DO_SYM      = 'do';
    const LET_SYM     = 'let';
    const DOT_SYM     = '.';
    const NEW_SYM     = 'new';
    const SET_SYM     = 'set!';
    const NIL_SYM     = 'nil';
    const TRUE_SYM    = 'true';
    const FALSE_SYM   = 'false';
    
    // Operators
    const MOD_SYM         = 'mod';
    const LT_SYM          = '<';
    const GT_SYM          = '>';
    const LTQ_SYM         = '<=';
    const GTQ_SYM         = '>=';
    const NOT_SYM         = 'not';
    const OR_SYM          = 'or';
    const AND_SYM         = 'and';
    const BIT_NOT_SYM     = 'bit-not';
    const BIT_OR_SYM      = 'bit-or';
    const BIT_XOR_SYM     = 'bit-xor';
    const BIT_AND_SYM     = 'bit-and';
    const BIT_LSHIFT_SYM  = 'bit-shift-left';
    const BIT_RSHIFT_SYM  = 'bit-shift-right';
    const BIT_URSHIFT_SYM = 'unsigned-bit-shift-right';
    const IDENTICAL_SYM   = 'identical?';
    const EQUIV_SYM       = 'equiv?';
    const PLUS_SYM        = '+';
    const MINUS_SYM       = '-';
    const DIV_SYM         = '/';
    const MULT_SYM        = '*';
    const AGET_SYM        = 'aget';
    const ASET_SYM        = 'aset';
    const ALENGTH_SYM     = 'alength';

    const MACRO_DEF_SYM   = 'defmacro';

    const NULL_SYM        = 'null';
    const UNDEFINED_SYM   = 'undefined';
    const EMPTY_ARRAY     = '[]';

    const SPECIAL_FORMS = {
        quote: true,
        def:   true,
        cond:  true,
        'js*': true,
        'fn*': true,
        loop: true,
        recur: true,
        throw: true,
        try: true,
        catch: true,
        finally: true,
        do: true,
        let: true,
        '.': true,
        new: true,
        'set!': true
    };

    const CORE_MOD = {};
    const CORE_NS = createNs('wonderscript.core', CORE_MOD);
    const CURRENT_NS = {
        value: CORE_NS
    };

    const RECURSION_POINT_CLASS = str(CORE_NS.name, '.RecursionPoint');

    function RecursionPoint(args) {
        this.args = args;
    }

    const RECUR_ERROR_MSG = 'recur can only be used in a tail position within a loop or function';

    var names = {
        '=': 'eq',
        'not=': 'noteq',
        '<': 'lt',
        '>': 'gt',
        '<=': 'lteq',
        '>=': 'gteq',
        '+': 'add',
        '-': 'sub',
        '*': 'mult',
        '/': 'div'
    };

    function cap(x) {
        if (x.length === 0) return x;
        return str(x[0].toUpperCase(), x.slice(1));
    }

    function wsNameToJS(x) {
        var prefix = null, parts;
        if (names[x]) return names[x];
        if (x.endsWith('?')) {
            prefix = 'is';
            x = x.slice(0, x.length - 1);
        }
        else if (x.endsWith('!')) {
            x = x.slice(0, x.length - 1);
        }
        else if (x.startsWith('*') && x.endsWith('*')) {
            return x.slice(0, x.length - 1).slice(1).split('-').map(function(s) { return s.toUpperCase(); }).join('_');
        }
        if (x.indexOf("->") !== -1) parts = x.split("->").reduce(function(a, x) { return [].concat(a, "to", x); });
        else parts = prefix ? [].concat(prefix, x.split('-')) : x.split('-');
        return [].concat(parts[0], parts.slice(1).map(cap)).join('');
    }

    const SPECIAL_CHARS = {
        '='   : '_EQ_',
        '\\-' : '_DASH_',
        '\\*' : '_STAR_',
        '!'   : '_BANG_',
        '\\?' : '_QUEST_',
        '\\^' : '_HAT_',
        '\\+' : '_PLUS_',
        '\\.' : '_DOT_'
    };

    function escapeChars(string) {
        var ch, str = string;
        for (ch in SPECIAL_CHARS) {
            str = str.replace(new RegExp(ch, 'g'), SPECIAL_CHARS[ch]);
        }
        return str;
    }

    const UNESCAPE_MAPPING = {
        _EQ_: '=',
        _DASH_: '-',
        _STAR_: '*',
        _BANG_: '!',
        _QUEST_: '?',
        _HAT_: '^',
        _PLUS_: '+',
        _DOT_: '.'
    };

    function unescapeChars(string) {
        var entry, str = string;
        for (entry in Object.entries(UNESCAPE_MAPPING)) {
            str = str.replace(new RegExp(entry[0], 'g'), entry[1]);
        }
        return str;
    }

    function Env(vars, parent) {
        this.vars = vars || {};
        this.parent = parent || null;
        this._isRecursive = false;
    }

    Env.prototype = Object.create(null);

    Env.prototype.toString = function() {
        var buffer = ['#<Env vars: ', Object.keys(this.vars).join(', ')];
        if (this.parent) {
            buffer.push('parent: ', this.parent.toString());
        }
        buffer.push('>');
        return buffer.join('');
    };

    Env.prototype.setRecursive = function() {
        this._isRecursive = true;
        return this;
    };

    Env.prototype.isRecursive = function() {
        return this._isRecursive;
    };

    function isEnv(x) {
        return x instanceof Env;
    }

    function env(parent) {
        return new Env(null, parent);
    }

    function lookup(env, name) {
        if (env == null) {
            return null;
        }
        else if (env.vars != null && env.vars[name] != null) {
            return env;
        }
        else {
            if (env.parent == null) {
                return null;
            }
            else {
                var scope = env.parent;
                while (scope != null) {
                    if (scope.vars != null && scope.vars[name] != null) {
                        return scope;
                    }
                    scope = scope.parent;
                }
                return null;
            }
        }
    }

    function define(env, name, value) {
        if (typeof value !== 'undefined') {
            env.vars[name] = value;
            return null;
        }
        else {
            env.vars[name] = null;
            return null;
        }
    }

    function findLexicalVar(env, name) {
        var scope = lookup(env, name);
        if (scope == null) {
            throw new Error(str('Undefined variable: "', name, '"'));
        }
        else {
            return scope.vars[name];
        }
    }

    function findNamespaceVar(s) {
        if (s.indexOf('/') !== -1) {
            var parts = s.split('/');
            if (parts.length !== 2) throw new Error('A symbol should only have 2 parts');
            var scope = lookup(env, parts[0]);
            if (scope === null) return null;
            else {
                var ns = scope.vars[parts[0]],
                    val = ns.module[parts[1]];
                if (isUndefined(val)) return null;
                return val;
            }
        }
        else {
            var s = escapeChars(s),
                val = CURRENT_NS.value.module[s];
            if (!isUndefined(val)) {
                return val;
            }
            else if (!isUndefined(val = CORE_NS.module[s])) {
                return val;
            }
            return null;
        }
    }

    function isMacro(x) {
        return isFunction(x) && getMeta(x, "macro") === true;
    }

    function isTaggedValue(x) {
        return isArray(x) && isString(x[0]);
    }

    function macroexpand(form, scope) {
        if (!isTaggedValue(form)) {
            return form;
        }
        else {
            var name = form[0];
            if (SPECIAL_FORMS[name]) {
                return form;
            }
            else if (name !== '.-' && name.startsWith('.-')) {
                return [DOT_SYM, form.slice(1)[0], name.slice(1)];
            }
            else if (name !== DOT_SYM && name.startsWith(DOT_SYM)) {
                return [DOT_SYM, form.slice(1)[0], [name.slice(1)].concat(form.slice(2))];
            }
            else if (name.endsWith(DOT_SYM)) {
                return [NEW_SYM, name.replace(/\.$/, '')].concat(form.slice(1));
            }
            else if (isString(form[0])) {
                var val = findNamespaceVar(form[0]);
                if (val === null) return form;
                else {
                    if (isMacro(val)) {
                        var args = form.slice(1);
                        var ctx = { env: env(scope), form: form };
                        return macroexpand(val.apply(ctx, args));
                    }
                    else {
                        return form;
                    }
                }
            }
            else {
                return form;
            }
        }
    }

    function emitMapEntry(env) {
        return (entry) => str(entry[0], ':', emit(entry[1], env));
    }

    function emitMap(m, env) {
        return str('({', map(emitMapEntry(env), Object.entries(m)).join(', '), '})');
    }

    const isMap = isObjectLiteral;

    const TOP = env();
    // TODO: try/catch/finally
    function emit(form_, env_) {
        var env_ = env_ || TOP;
        var form = macroexpand(form_, env_);
        if (isString(form)) {
            return emitSymbol(form, env_);
        }
        else if (isNumber(form)) {
            return str(form);
        }
        else if (isBoolean(form)) {
            return form === true ? TRUE_SYM : FALSE_SYM;
        }
        else if (isNull(form)) {
            return NULL_SYM;
        }
        else if (isUndefined(form)) {
            return UNDEFINED_SYM;
        }
        else if (isMap(form)) {
            return emitMap(form);
        }
        else if (isArray(form)) {
            if (form.length === 0) {
                return EMPTY_ARRAY;
            }
            else if (isString(form[0])) {
                switch(form[0]) {
                  case DEF_SYM:
                    return emitDef(form, env_);
                  case QUOTE_SYM:
                    return emitQuote(form, env_);
                  case COND_SYM:
                    return emitCond(form, env_);
                  case JS_SYM:
                    return form[1][1];
                  case FN_SYM:
                    return emitFunc(form, env_);
                  case LOOP_SYM:
                    return emitLoop(form, env_);
                  case RECUR_SYM:
                    throw new Error(RECUR_ERROR_MSG);
                  case THROW_SYM:
                    return emitThrownException(form, env_);
                  case TRY_SYM:
                    throw new Error("not implemented");
                  case DO_SYM:
                    return emitDo(form, env_);
                  case LET_SYM:
                    return emitLet(form, env_);
                  case DOT_SYM:
                    return emitObjectRes(form, env_);
                  case NEW_SYM:
                    return emitClassInit(form, env_);
                  case SET_SYM:
                    return emitAssignment(form, env_);
                  // operators
                  case MOD_SYM:
                    return str('(', emit(form[1], env_), '%', emit(form[2], env_), ')');
                  case LT_SYM:
                    return str('(', emit(form[1], env_), '<', emit(form[2], env_), ')');
                  case GT_SYM:
                    return str('(', emit(form[1], env_), '>', emit(form[2], env_), ')');
                  case LTQ_SYM:
                    return str('(', emit(form[1], env_), '<=', emit(form[2], env_), ')');
                  case GTQ_SYM:
                    return str('(', emit(form[1], env_), '>=', emit(form[2], env_), ')');
                  case NOT_SYM:
                    return str('!(', emit(form[1], env_), ')');
                  case OR_SYM:
                    return emitBinOperator(['||'].concat(form.slice(1)), env_);
                  case AND_SYM:
                    return emitBinOperator(['&&'].concat(form.slice(1)), env_);
                  case BIT_NOT_SYM:
                    return str('~(', emit(form[1], env_), ')');
                  case BIT_OR_SYM:
                    return emitBinOperator(['|'].concat(form.slice(1)), env_);
                  case BIT_XOR_SYM:
                    return emitBinOperator(['^'].concat(form.slice(1)), env_);
                  case BIT_AND_SYM:
                    return emitBinOperator(['&'].concat(form.slice(1)), env_);
                  case BIT_LSHIFT_SYM:
                    return emitBinOperator(['<<'].concat(form.slice(1)), env_);
                  case BIT_RSHIFT_SYM:
                    return emitBinOperator(['>>'].concat(form.slice(1)), env_);
                  case BIT_URSHIFT_SYM:
                    return emitBinOperator(['>>>'].concat(form.slice(1)), env_);
                  case IDENTICAL_SYM:
                    return emitBinOperator(['==='].concat(form.slice(1)), env_);
                  case EQUIV_SYM:
                    return emitBinOperator(['=='].concat(form.slice(1)), env_);
                  case PLUS_SYM:
                  case MINUS_SYM:
                  case DIV_SYM:
                  case MULT_SYM:
                    return emitBinOperator(form, env_);
                  case AGET_SYM:
                    return emitArrayAccess(form, env_);
                  case ASET_SYM:
                    return emitArrayMutation(form, env_);
                  case ALENGTH_SYM:
                    return emitArrayLength(form, env_);
                  default:
                    return emitFuncApplication(form, env_);
                }
            }
            else {
                return emitFuncApplication(form, env_);
            }
        }
        else {
            throw new Error("Invalid form: " + form);
        }
    }

    function emitArrayAccess(form, env) {
        if (form.length !== 3)
            throw new Error(str('Wrong number of arguments expected 2, got ', form.length - 1));

        return str(emit(form[1], env), '[', emit(form[2], env), ']');
    }

    function emitArrayMutation(form, env) {
        if (form.length !== 4)
            throw new Error(str('Wrong number of arguments expected 3, got ', form.length));

        return str(emit(form[1], env), '[', emit(form[2], env), ']=', emit(form[3], env));
    }

    function emitArrayLength(form, env) {
        if (form.length !== 2)
            throw new Error(str('Wrong number of arguments expected 1, got ', form.length));

        return str(emit(form[1], env), '.length');
    }

    function emitQuote(form) {
        if (form.length !== 2) throw new Error('One value should be quoted');
        return emitQuotedValue(form[1]);
    }

    function emitQuotedValue(val) {
        if (isString(val)) {
            return JSON.stringify(val);
        }
        else if (isNumber(val)) {
            return str(val);
        }
        else if (val === true) {
            return TRUE_SYM;
        }
        else if (val === false) {
            return FALSE_SYM;
        }
        else if (val === null) {
            return NULL_SYM;
        }
        else if (isUndefined(val)) {
            return UNDEFINED_SYM;
        }
        else if (isArray(val)) {
            if (val.length === 0) return EMPTY_ARRAY;
            return str('[', map(emitQuotedValue, val).join(', '), ']');
        }
        else if (isMap(val)) {
            return str('({', map((xs) => str(xs[0], ':', emitQuotedValue(xs[1])), Object.entries(val)).join(', '), '})');
        }
        throw new Error('Invalid form: ' + val);
    }

    function emitSymbol(s, env) {
        var scope;
        if (s === '&env') {
            return 'this.env';
        }
        else if (s === '&form') {
            return 'this.form';
        }
        else if (s.indexOf('/') !== -1) {
            var parts = s.split('/');
            if (parts.length !== 2) throw new Error('A symbol should only have 2 parts');
            scope = lookup(env, parts[0]);
            if (scope === null) throw new Error('Unknown namespace: ' + parts[0]);
            else {
                var ns = scope.vars[parts[0]];
                if (isUndefined(ns.module[escapeChars(parts[1])])) {
                    throw new Error('Undefined variable: ' + parts[1] + ' in namespace: ' + parts[0]);
                }
                return str(ns.name, '.', escapeChars(parts[1]));
            }
        }
        else {
            var s_ = escapeChars(s);
            scope = lookup(env, s_);
            if (scope !== null) {
                return s_;
            }
            else if (!isUndefined(CURRENT_NS.value.module[s_])) {
                return str(CURRENT_NS.value.name, '.', s_);
            }
            else if (!isUndefined(CORE_NS.module[s_])) {
                return str(CORE_NS.name, '.', s_);
            }
            else {
                throw new Error(str('Undefined variable: "', s, '"'));
            }
        }
    }

    function emitRecursionPoint(form, env) {
        return str("throw new ", RECURSION_POINT_CLASS, "([",
            form.slice(1).map(function(x) { return emit(x, env); }).join(', '), "])");
    }

    function emitThrownException(form, env) {
        if (form.length !== 2)
            throw new Error(str('Wrong number of arguments should have 2, got', form.length));
        return str("throw ", emit(form[1], env));
    }

    function isRecur(x) {
        return isArray(x) && x[0] === RECUR_SYM;
    }

    function isThrow(x) {
        return isArray(x) && x[0] === THROW_SYM;
    }
    
    function emitTailPosition(x, env, def) {
        var def_ = def || 'return';
        if (isRecur(x)) {
            if (!env.isRecursive()) throw new Error(RECUR_ERROR_MSG);
            return emitRecursionPoint(x, env);
        }
        else if (isThrow(x)) {
            return emitThrownException(x, env);
        }
        else {
            return str(def_, ' ', emit(x, env));
        }
    }

    function emitCond(form, env) {
        var i, cond, x,
            exprs = partition(2, rest(form)),
            buff = [];
        for (i = 0; i < exprs.length; ++i) {
            cond = i === 0 ? 'if' : 'else if';
            if ( exprs[i][0] === 'else' ) {
                buff.push(str('else { ', emitTailPosition(exprs[i][1], env), ' }')); 
            }
            else {
                x = emit(exprs[i][0], env);
                buff.push(str(cond, '(', x, ' != null && ', x, ' !== false){ ', emitTailPosition(exprs[i][1], env), ' }')); 
            }
        }
        return str('(function(){ ', buff.join(' '), '}())');
    }

    function compileBody(body, env, tailDef) {
        var last = body[body.length - 1],
            head = body.slice(0, body.length - 1);
        return map(function(x) { return emit(x, env); }, head)
                .concat(emitTailPosition(last, env, tailDef)).join('; ');
    }

    function compileRecursiveBody(body, names, env) {
        var i, rebinds, buff = [];
        for (i = 0; i < names.length; i++) {
            buff.push(str(names[i], ' = e.args[', i, ']'));
        }
        rebinds = buff.join('; ');
        env.setRecursive();
        return str(
            "var retval;\nloop:\n\twhile (true) { try { ",
            compileBody(body, env, 'retval ='),
            "; break loop; } catch (e) { if (e instanceof ", RECURSION_POINT_CLASS,
            ") { ", rebinds, "; continue loop; } else { throw e; } } };\nreturn retval"
        );
    }

    function emitLoop(form, env_) {
        var env_ = env(env_);
        if (form.length < 3)
            throw new Error('A loop expression should have at least 3 elements');

        var i, bind,
            buff = ['(function('],
            rest = form.slice(1),
            binds = rest[0],
            body = rest.slice(1);

        var names = [];
        for (i = 0; i < binds.length; i += 2) {
            if (!isString(binds[i]))
                throw new Error('Invalid binding name');
            bind = escapeChars(binds[i]);
            define(env_, bind, true);
            names.push(bind);
        }
        buff.push(names.join(', '));
        buff.push('){');

        // body
        buff.push(compileRecursiveBody(body, names, env_));
        buff.push('}(');

        // add values to function scope
        var values = [];
        for (i = 0; i < binds.length; i += 2) {
            values.push(emit(binds[i + 1], env_));
        }
        buff.push(values.join(', '));
        buff.push('))');

        return buff.join('');
    }
  
    function emitLet(form, env_) {
        var env_ = env(env_);
        if (form.length < 2) throw new Error('A let expression should have at least 2 elements');
        var i, bind,
            buff = ['(function('],
            rest = form.slice(1),
            binds = rest[0],
            body = rest.slice(1);

        // add names to function scope
        var names = [];
        for (i = 0; i < binds.length; i += 2) {
            if (!isString(binds[i]))
                throw new Error('Invalid binding name');
            bind = escapeChars(binds[i]);
            define(env_, bind, true);
            names.push(bind);
        }
        buff.push(names.join(', '));
        buff.push('){');

        // body
        buff.push(compileBody(body, env_));
        buff.push('}(');

        // add values to function scope
        var values = [];
        for (i = 0; i < binds.length; i += 2) {
            values.push(emit(binds[i + 1], env_));
        }
        buff.push(values.join(', '));
        buff.push('))');

        return buff.join('');
    }

    function emitDef(form, env, opts) {
        var name = escapeChars(form[1]), code, value, def;
        if (form[2]) {
            code = emit(form[2], env); value = eval(code);
            def = str(CURRENT_NS.value.name, ".", name, " = ", code, ";");
        }
        else {
            code = 'null'; value = null;
            def = str(CURRENT_NS.value.name, ".", name, " = null;");
        }
        CURRENT_NS.value.module[name] = value;
        return def;
    }
  
    function emitAssignment(form, env) {
        if (form.length !== 3) throw new Error('set! should have 3 and only 3 elements');
        return str(emit(form[1], env), " = ", emit(form[2], env));
    }
  
    function parseArgs(args) {
        var splat = false, name, argsBuf = [];
        for (var i = 0; i < args.length; ++i) {
            if ( args[i].startsWith('&') ) {
                name = args[i].replace(/^&/, '');
                splat = true;
            }
            else {
                name = args[i];
            }
            argsBuf.push({name: escapeChars(name), order: i, splat: splat});
        }
        return argsBuf;
    }
  
    function genArgAssigns(argsBuf) {
        var argsAssign = [], i;
        for (i = 0; i < argsBuf.length; ++i) {
            if (argsBuf[i].splat) {
                argsAssign.push(str('var ', argsBuf[i].name, " = Array.prototype.slice.call(arguments, ", i, ")"));
            }
        }
        return argsAssign.join('');
    }
  
    function genArgsDef(argsBuf) {
        var i, argsDef = [];
        for (i = 0; i < argsBuf.length; ++i) {
            argsDef.push(argsBuf[i].name);
        }
        return argsDef.join(',');
    }
  
    function hasTailCall(form) {
        if (isArray(form) && form[0] === RECUR_SYM) {
            return true;
        }
        else if (isArray(form) && form[0] === COND_SYM) {
            return form.slice(1).some(hasTailCall);
        }
        else if (isArray(form) && form[0] === FN_SYM) {
            return form.slice(2).some(hasTailCall);
        }
        else if (isArray(form)) {
            return form.some(hasTailCall);
        }
        else {
            return false;
        }
    }

    function emitFunc(form, env_, opts) {
        var env_ = env(env_),
            args = form[1],
            argsDef, argsAssign, argsBuf, expr, i, value;
  
        if (form.length < 2)
            throw new Error("a function requires at least an arguments list and a body");
        else {
            if (!isArray(args)) throw new Error("an arguments list is required");
  
            argsBuf = parseArgs(args);
            argsAssign = genArgAssigns(argsBuf);
            argsDef = genArgsDef(argsBuf);

            for (i = 0; i < argsBuf.length; i++) {
                define(env_, argsBuf[i].name, true);
            }
    
            var buf = [argsAssign],
                body = form.slice(2),
                names = map(function(x) { return x.name; }, argsBuf);

            if (hasTailCall(body)) {
                buf.push(compileRecursiveBody(body, names, env_));
            }
            else if (body.length === 0) {
                buf = [];
            }
            else {
                buf.push(compileBody(body, env_));
            }
  
            return str("(function(", argsDef, ") { ", buf.join('; '), "; })");
        }
    }
  
    function emitDo(form, env) {
        var exprs = form.slice(0, form.length - 1).slice(1),
            buf = [],
            last = form[form.length - 1];
        var i;
        for (i = 0; i < exprs.length; ++i) {
            buf.push(emit(exprs[i], env, env));
        }
        buf.push(emitTailPosition(last, env));
  
        return str("(function(){ ", buf.join('; '), "; }())");
    }
  
    function emitObjectRes(form, env) {
        var obj = form[1], prop = form[2];
        if (isArray(prop)) {
            var method = prop[0], args = prop.slice(1);
            return str('(', emit(obj, env), ').', escapeChars(method), '(',
                map(function(x) { return emit(x, env); }, args).join(', '), ')');
        }
        else if (isString(prop)) {
            if (prop.startsWith('-')) {
                return str('(', emit(obj, env), ').', escapeChars(prop.slice(1)));
            }
            else {
                return str('(', emit(obj, env), ').', escapeChars(prop), '()');
            }
        }
        else {
            throw new Error("'.' form requires at least 3 elements");
        }
    }
  
    function emitClassInit(form, env) {
      var args = map(emit, form.slice(2)).join(', ');
      return str('new ', emit(form[1], env), '(', args, ')');
    }

    function emitFuncApplication(form, env) {
        if (isString(form[0]) && isMacro(findNamespaceVar(form[0])))
            throw new Error('Macros cannot be evaluated in this context');

        var fn = emit(form[0], env),
            args = form.slice(1, form.length),
            argBuffer = [], i, value;

        for (i = 0; i < args.length; ++i) {
            value = emit(args[i], env);
            argBuffer.push(value);
        }
    
        if (argBuffer.length === 0) {
            return str('(', fn, ')()');
        }

        return str('(', fn, ')(', argBuffer.join(', ') ,")");
    }
    
    function emitBinOperator(form, env) {
      var op = form[0],
          values = form.slice(1, form.length),
          valBuffer = [], i;
      for (i = 0; i < values.length; ++i) {
        valBuffer.push(emit(values[i], env));
      }
      return str('(', valBuffer.join(op), ')');
    }

    function evaluate(form) {
        return eval(emit(form));
    }

    var EOF = { eof: true };
    function isEOF(x) {
        return x && x.eof === true;
    }

    function stacktrace(stack) {
        var i, frame, buffer = [];
        for (i = 0; i < stack.length; i++) {
            frame = stack[i];
            buffer.push(str(frame[0], ' - ', frame[1], ':', frame[2]));
        }
        return buffer.join('\n');
    }

    function evalString(s, source) {
        var r = new PushBackReader(s);
        var src = source || 'inline';
        var res, ret, scope = TOP, stack = [], evalingTaggedValue = false;
        var a, b;
        while (true) {
            //console.log('line before: ', r.line());
            res = read(r, { eofIsError: false, eofValue: EOF });
            //console.log('line after: ', r.line());
            //console.log(prStr(res), str(src, ':', r.line()));
            if (isEOF(res)) return ret;
            if (isTaggedValue(res)) {
                evalingTaggedValue = true;
                stack.unshift([res[0], src, r.line()]);
            }
            if (res != null) {
                try {
                    ret = eval(emit(res, scope, stack));
                }
                catch (e) {
                    console.log(stacktrace(stack));
                    throw e;
                }
            }
            if (evalingTaggedValue) {
                evalingTaggedValue = false;
                stack.shift();
            }
        }
    }

    function readString(s) {
        var r = new PushBackReader(s);
        var res, ret, seq = [];
        while (true) {
            res = read(r, { eofIsError: false, eofValue: EOF });
            if (isEOF(res)) return seq;
            if (res != null) seq.push(res);
        }
    }

    function evalAll(seq) {
        var i, form, evaled = [];
        for (i = 0; i < seq.length; i++) {
            form = seq[i];
            evaluate(form);
            evaled.push(form);
        }
        return evaled;
    }

    // Walk tree and expand all macros
    function expandMacros(form) {
        if (!isArray(form)) {
            return form;
        }
        else if (isArray(form) && isString(form[0])) {
            var args = form.slice(1);
            return macroexpand(cons(form[0], args.map(expandMacros)));
        }
        else {
            return map(expandMacros, form);
        }
    }

    function expandAllMacros(seq) {
        var i, form_, expanded = [];
        for (i = 0; i < seq.length; i++) {
            form_= expandMacros(expandMacros(seq[i]));
            expanded.push(form_);
        }
        return expanded;
    }

    function compileString(s) {
        var seq = expandAllMacros(evalAll(readString(s)));
        var i, buffer = [];
        for (i = 0; i < seq.length; i++) {
            buffer.push(emit(seq[i]));
        }
        return buffer.join(';\n');
    }

    function prStr(x) {
        if (x == null) return NIL_SYM;
        else if (isNumber(x)) return str(x);
        else if (isBoolean(x)) {
            return x ? TRUE_SYM : FALSE_SYM;
        }
        else if (isString(x)) {
            return x;
        }
        else if (isArray(x)) {
            if (x.length === 0) {
                return '()';
            }
            else {
                var y;
                var ys = x;
                var buffer = [];
                while (ys !== null) {
                    y = first(ys);
                    ys = next(ys);
                    buffer.push(prStr(y));
                }
                return str('(', buffer.join(' '), ')');
            }
        }
        else if (isArray(x)) {
            if (x.length === 0) {
                return '(array)';
            }
            return str('(array ', x.map(prStr).join(' '), ')');
        }
        else if (isFunction(x)) {
            return str('#js/function "', x.toString(), '"');
        }
        else if (x.toString) {
            return x.toString();
        }
        else if (isMap(x)) {
            return str('{', map((entry) => str(prStr(entry[0]), ' ', prStr(entry[1])), Object.entries(x)).join(' '), '}');
        }
        else if (isArrayLike(x)) {
            return str('#js/object {',
                Array.prototype.slice.call(x)
                     .map((x, i) => str(i, ' ', prStr(x)))
                     .join(', '), '}');
        }
        else {
            return "" + x;
        }
    }

    if (IS_NODE) {
        const fs = require('fs');
        CORE_MOD.loadFile = function(f) {
            return evalString(fs.readFileSync(f, 'utf8'), f);  
        };
        CORE_MOD.readFile = function(f) {
            return readString(fs.readFileSync(f, 'utf8'), f);  
        };
    }

    function setMacro(obj) {
        return setMeta(obj, 'macro', true);
    }

    define(TOP, CORE_NS.name, CORE_NS);
    define(TOP, 'js', IS_NODE ? createNs('global', global) : createNs('window', window));

    Object.assign(CORE_MOD, core);

    const CORE_NAMES = {
        'eq'    : '=',
        'noteq' : 'not=',
        'lt'    : '<',
        'gt'    : '>',
        'lteq'  : '<=',
        'gteq'  : '>=',
        'add'   : '+',
        'sub'   : '-',
        'mult'  : '*',
        'div'   : '/'
    };

    const DASH = '-';
    const UNDERSCORE = '_';

    function dasherize(string) {
        var i, ch, buffer = [];

        for (i = 0; i < string.length; i++) {
            ch = string[i];
            if (ch.match(/[A-Z]/)) { // TODO: replace this with a numerical method
                buffer.push(DASH);
                buffer.push(ch.toLowerCase());
            }
            else if (ch === UNDERSCORE) {
                buffer.push(DASH);
            }
            else {
                buffer.push(ch);
            }
        }

        return buffer.join('');
    }

    CORE_MOD.import = function(name, value) {
        var value = value || eval(name);
        var wsName = CORE_NAMES[name];
        if (wsName) {
            wsName = escapeChars(dasherize(wsName));
        }
        else if (name.startsWith('is')) {
            wsName = str(name.slice(2).toLowerCase(), '?');
            wsName = escapeChars(dasherize(wsName));
        }
        else {
            wsName = escapeChars(dasherize(name));
        }
        define(TOP, name, value);
    };

    function importSymbol(name, obj) {
        var wsName = CORE_NAMES[name];
        if (wsName) {
            wsName = escapeChars(dasherize(wsName));
        }
        else if (name.startsWith('is')) {
            wsName = str(name.slice(2).toLowerCase(), '?');
            wsName = escapeChars(dasherize(wsName));
        }
        else {
            wsName = escapeChars(dasherize(name));
        }
        CORE_MOD[wsName] = obj;
    }

    function importModule(module) {
        Object.keys(module).forEach(function(name) {
            importSymbol(name, module[name]);
        });
    }

    importModule(core);

    importModule({
        compile: emit,
        eval: evaluate,
        evalString,
        compileString,
        readString,
        setMeta,
        setMacro,
        prStr,
        meta,
        macroexpand,
        isEnv
    });

    JSGLOBAL.wonderscript = JSGLOBAL.wonderscript || {};
    JSGLOBAL.wonderscript.core = CORE_MOD;
    JSGLOBAL.wonderscript.compiler = {
        compile: emit,
        eval: evaluate,
        evalString,
        compileString,
        readString,
        evalAll,
        expandAllMacros,
        expandMacros,
        prStr,
        importSymbol,
        importModule
    };

    CORE_MOD.NS = CURRENT_NS;
    importSymbol('*ns*', CURRENT_NS.value);
    importSymbol(CORE_NS.name, CORE_NS);
    CORE_MOD.RecursionPoint = RecursionPoint;

    const COMPILER_NS = createNs('wonderscript.compiler');
    importSymbol(COMPILER_NS.name, COMPILER_NS);

    if (IS_NODE) module.exports = JSGLOBAL.wonderscript.compiler;

}.call(JSGLOBAL);
