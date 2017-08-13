// jshint esversion: 5
// jshint eqnull: true
// jshind evil: true

var zera = (function() {
"use strict";

var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
var isBrowser = typeof window !== 'undefined';

function cons(car, cdr) {
  if (cdr == null) {
    return {$car: car, $cdr: cdr, $count: 0};
  }
  else if (!isCons(cdr)) {
    return {$car: car, $cdr: cdr, $count: 1};
  }
  else {
    return {$car: car, $cdr: cdr, $count: count(cdr) + 1};
  }
}

function count(cons) {
  return cons == null ? 0 : cons.$count;
}

function car(cons) {
  return cons.$car;
}

function cdr(cons) {
  return cons.$cdr;
}

function isCons(x) {
  if (x == null) {
    return false;
  }
  else {
    return x.$car !== void(0) && x.$cdr !== void(0);
  }
}

function isPair(x) {
  return isCons(x) && !isCons(cdr(x)) && cdr(x) != null;
}

var Nil = cons(null, null);

function isNil(x) {
  return x == null || (car(x) === null && cdr(x) === null);
}

function list() {
  if (arguments.length === 0) {
    return Nil;
  }
  else if (arguments.length === 1) {
    return cons(arguments[0], Nil);
  }
  var i, x;
  var xs = Nil;
  for (i = arguments.length - 1; i >= 0; i--) {
    x = arguments[i];
    xs = cons(x, xs);
  }
  return xs;
}

function prnStr(x) {
  if (isNil(x)) return "()";
  else if (isNumber(x)) return s(x);
  else if (isBoolean(x)) {
    return x ? "true" : "false";
  }
  else if (isSymbol(x)) {
    return x;
  }
  else if (isEnv(x)) {
    return 'env';
  }
  else if (isCons(x)) {
    if (isPair(x)) {
      return s('(', prnStr(car(x)), " & ", prnStr(cdr(x)), ')');
    }
    else {
      var y  = car(x);
      var ys = cdr(x);
      var buffer = [];
      while (y != null) {
        buffer.push(prnStr(y));
        y  = car(ys);
        ys = cdr(ys);
      }
      return s('(', buffer.join(' '), ')');
    }
  }
  else {
    return "" + x;
  }
}

function prn(x) {
  console.log(prnStr(x));
}

function isBoolean(x) {
  return Object.prototype.toString.call(x) === '[object Boolean]';
}

// symbols can be quoted with ":", "'" or by surrounding in "'s
function isSymbol(x) {
  return Object.prototype.toString.call(x) === '[object String]';
}

var s = function() {
  return Array.prototype.slice.call(arguments).join('');
};

function arrayToList(a) {
  var i;
  var list = Nil;
  for (i = a.length; i >= 0; i--) {
    list = cons(a[i], list);
  }
  return list;
}

function isNumber(x) {
  return Object.prototype.toString.call(x) === '[object Number]';
}

function isAtom(x) {
  return isBoolean(x) || isNumber(x) || isNil(x);
}

function eq(a, b) {
  if (a == null) {
    return b == null;
  }
  else if (isNil(a)) {
    return isNil(b);
  }
  else if (isCons(a)) {
    if (isCons(b)) {
      var xa  = car(a);
      var xb  = car(b);
      var xsa = cdr(a);
      var xsb = cdr(b);
      while (xa !== null && xb !== null) {
        if (xa !== xb) {
          return false;
        }
        else {
          xa  = car(xsa);
          xb  = car(xsb);
          xsa = cdr(xsa);
          xsb = cdr(xsb);
        }
      }
      return true;
    }
    else {
      return false;
    }
  }
  else {
    return a === b;
  }
}

var p = console.log.bind();

function is(expected, actual, msg) {
  if (expected === actual) {
    if (msg) {
      p(s('passed - ', msg));
    }
    else {
      p('passed');
    }
  }
  else {
    if (msg) {
      p(s('failed - ', msg));
    }
    else {
      p('failed');
    }
    p('expected: ', expected);
    p('got: ', actual);
  }
}

function ok(value, msg) {
  if (value != null && value !== false) {
    if (msg) {
      p(s('passed - ', msg));
    }
    else {
      p('passed');
    }
  }
  else {
    if (msg) {
      p(s('failed - ', msg));
    }
    else {
      p('failed');
    }
  }
}

function evalQuote(form) {
  return car(cdr(form));
}

function env(parent) {
  if (parent) {
    return {vars: {}, parent: parent};
  }
  else {
    return {vars: {}, parent: null};
  }
}

function isEnv(x) {
  return x != null && x.vars !== void(0);
}

function lookup(env, name) {
  if (env == null) {
    p('env null');
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
    return value;
  }
  else {
    env.vars[name] = null;
    return null;
  }
}

function findVar(env, name) {
  var scope = lookup(env, name);
  if (scope == null) {
    throw new Error(s('Undefined variable: "', name, '"'));
  }
  else {
    return scope.vars[name];
  }
}

function set(env, name, value) {
  var scope = lookup(env, name);
  if (scope == null) {
    throw new Error(s('Undefined variable: "', name, '"'));
  }
  else {
    scope.vars[name] = value;
    return value;
  }
}

function evalDefinition(form, env) {
  var rest  = cdr(form);
  var name  = car(rest);
  var value = car(cdr(rest));
  define(env, name);
  return define(env, name, evaluate(value, env));
}

function evalAssignment(form, env) {
  var rest  = cdr(form);
  var name  = car(rest);
  var value = car(cdr(rest));
  return set(env, name, evaluate(value, env));
}

function reverse(xs) {
  if (isNil(xs)) {
    return Nil;
  }
  else {
    var xs_ = cdr(xs), x = car(xs), l = Nil;
    while (x) {
      l   = cons(x, l);
      x   = car(xs_);
      xs_ = cdr(xs_);
    }
    return l;
  }
}

function pair(xs) {
  if (isNil(xs)) {
    return Nil;
  }
  else if (count(xs) == 1) {
    return xs;
  }
  else {
    var xs_ = xs,
      x = car(xs_), 
      y = car(cdr(xs_)),
      l = Nil;
    while (x && y) {
      l = cons(cons(x, y), l);
      xs_ = cdr(cdr(xs_));
      x = car(xs_);
      y = car(cdr(xs_));
    }
    return l;
  }
}

function objectToPairs(obj) {
  var keys = obj.getOwnPropertyNames();
  var l = Nil, i;
  for (i = 0; i < keys.length; i++) {
    l = cons(cons(keys[i], obj[keys[i]]), l);
  }
  return l;
}

function evalConditional(form, env) {
  var preds = cdr(form);
  if (count(preds) % 2 !== 0) {
    throw new Error('cond requires an even number of predicates');
  }
  var i = 1, x, y, rest, xs = preds;
  while (i < count(preds)) {
    rest = cdr(xs);
    x    = car(xs);
    y    = car(rest);
    if (x === 'else') {
      return evaluate(y, env);
    }
    else {
      x = evaluate(x, env);
      if (!isNil(x) && x !== false) {
        return evaluate(y, env);
      }
    }
    xs = cdr(rest);
    i++;
  }
  return Nil;
}

function isFn(x) {
  return isPair(x) && car(car(x)) === 'fn';
}

function isJSFn(x) {
  return Object.prototype.toString.call(x) === '[object Function]';
}

function listToArray(cons) {
  var x  = car(cons);
  var xs = cdr(cons);
  var a  = [];
  while (x != null) {
    a.push(x);
    x  = car(xs);
    xs = cdr(xs);
  }
  return a;
}

// add capture variables using pair notation
function apply(x, args) {
  if (isJSFn(x)) {
    return x.apply(null, listToArray(args));
  }
  if (!isFn(x)) {
    throw new Error(s('Not a valid function: "', x, '"'));
  }
  var fn    = car(x);
  var env   = cdr(x);
  var rest  = cdr(fn);
  var names = car(rest);
  var body  = cdr(rest);

  if (isNil(body)) return Nil;

  var namec = count(names);
  var argc  = count(args);
  if (namec !== argc) {
    throw new Error(s('Wrong number of arguments, expected: ', namec, ', got: ', argc));
  }

  // bind arguments
  var nm = car(names),
    ns = cdr(names),
    a  = car(args),
    as = cdr(args);
  while (nm != null) {
    define(env, nm, a);
    nm = car(ns);
    ns = cdr(ns);
    a  = car(as);
    as = cdr(as);
  }

  // evaluate body
  var ret = null, exp = car(body), exprs = cdr(body);
  while (exp != null) {
    ret   = evaluate(exp, env);
    exp   = car(exprs);
    exprs = cdr(exprs);
  }
  return ret;
}

function pt(tag, val) {
  p(s(tag, ': ', prnStr(val)));
}

function evalApplication(form, env) {
  var fn   = evaluate(car(form), env);
  var args = cdr(form);
  var a    = car(args);
  var as   = cdr(args);
  //pt('args', args);
  var args_ = arrayToList(map(function(x) { return evaluate(x, env); }, args));
  //pt('args_', reverse(args_));
  return apply(fn, args_);
}

function evalFunction(form, env_) {
  var rest = cdr(form),
    names  = car(rest),
    body   = cdr(rest);
  //p(names);
  if (!isCons(names)) throw new Error('function arguments should be a list');
  // TODO: add variable validation, capture variable values from environment
  return cons(form, env(env_));
}

var MACROS = {};
function evalMacroDefinition(form, env) {
  var rest = cdr(form),
    name   = car(rest),
    fnrest = cdr(rest);
  MACROS[name] = evalFunction(cons("fn", fnrest), env);
  //prn(MACROS[name]);
  //prn(apply(MACROS[name], list(1, 2)));
  return name;
}

function isTaggedValue(x) {
  return isCons(x) && isSymbol(car(x));
}

function macroexpand(form) {
  if (isTaggedValue(form)) {
    var name = car(form);
    if (name.startsWith('.-')) {
      return list('.', car(cdr(form)), name.slice(1));
    }
    else if (name.startsWith('.')) {
      return list('.', car(cdr(form)), cons(name.slice(1), cdr(cdr(form))));
    }
    else if (name.endsWith('.')) {
      return cons('new', cons(name.replace(/\.$/, ''), cdr(form)));
    }
    else {
      var macro = MACROS[name];
      if (macro != null) {
        return macroexpand(apply(macro, cdr(form)));
      }
    }
  }
  return form;
}

function RecursionPoint(args) {
  this.args = args;
}

function evalRecursionPoint(form, env) {
  //pt('raw args', cdr(form));
  var args = map(function(x) {
    //pt('x', x);
    var y = evaluate(x, env);
    //pt('y', y);
    return y;
  }, cdr(form));
  throw new RecursionPoint(args);
}

function evalLoop(form, env_) {
  var binds = car(cdr(form));
  var body  = cdr(cdr(form));
  var scope = env(env_);
  var ret   = Nil;

  if (count(binds) % 2 !== 0) {
    throw new Error('loop requires an even number of bindings');
  }

  // bind variables & collect names
  var i;
  var binds_ = listToArray(binds);
  var names = [], name, value, evaled;
  for (i = 0; i < binds_.length; i += 2) {
    name = binds_[i];
    value = binds_[i+1];
    names.push(name);
    //pt(name, value);
    define(scope, name);
    evaled = evaluate(value, scope);
    define(scope, name, evaled);
  }

  loop:
  while (true) {
    try {
      // evaluate body
      var exp = car(body), exprs = cdr(body);
      while (exp != null) {
        ret   = evaluate(exp, scope);
        exp   = car(exprs);
        exprs = cdr(exprs);
      }
      break;
    }
    catch (e) {
      //p(e.args);
      if (e instanceof RecursionPoint) {
        if (names.length !== e.args.length) {
          throw new Error(s('Wrong number or arguments, expected: ', names.length, ' got: ', e.args.length));
        }
        for (i = 0; i < names.length; i += 2) {
          //console.log('rebinding: ', names, ' to ', e.args);
          define(scope, names[i], evaluate(e.args[i], scope));
        }
        continue loop;
      }
      else {
        throw e;
      }
    }
  }
  return ret;
}

function evalClassInstantiation(form, env) {
  var ctr  = evaluate(car(cdr(form)), env);
  if (!isJSFn(ctr)) throw new Error('class given is not a valid constructor');
  var args = map(function(x) { return evaluate(x, env); }, cdr(cdr(form)));
  return new (ctr.bind.apply(ctr, [].concat(ctr, args)));
}

function evalMemberAccess(form, env) {
  var obj = evaluate(car(cdr(form)), env);
  var member = car(cdr(cdr(form)));
  var val;
  if (isSymbol(member)) {
    val = obj[member];
    if (member.startsWith('-')) {
      return obj[member.slice(1)];
    }
    else if (isJSFn(val)) {
      return val.call(obj);
    }
    else {
      return val;
    }
  }
  else if (isCons(member)) {
    var name = car(member);
    val = obj[name];
    if (name.startsWith('-')) {
      return obj[name.slice(1)];
    }
    else if (isJSFn(val)) {
      var args = map(function(x) { return evaluate(x, env); }, cdr(member));
      return val.apply(obj, args);
    }
    else {
      throw new Error(s('invalid member access: "', prnStr(form), '"'));
    }
  }
}

var top = env();
function evaluate(form_, env_) {
  var env   = env_ || top;
  var recur = true;
  var ret   = null;
  var form  = macroexpand(form_);
  while (recur) {
    recur = false;
    if (form == null) {
      ret = Nil;
    }
    else if (isAtom(form) || isJSFn(form)) {
      ret = form;
    }
    else if (isSymbol(form)) {
      ret = findVar(env, form);
      //if (form === 'i') pt('evalVar i', ret);
    }
    else if (isCons(form)) {
      var tag = car(form);
      switch (tag) {
        case 'quote':
          ret = evalQuote(form);
          break;
        case 'def':
          ret = evalDefinition(form, env);
          break;
        case 'set!':
          ret = evalAssignment(form, env);
          break;
        case 'cond':
          ret = evalConditional(form, env);
          break;
        case 'fn':
          ret = evalFunction(form, env);
          break;
        case 'loop':
          ret = evalLoop(form, env);
          break;
        case 'recur':
          ret = evalRecursionPoint(form, env);
          break;
        case 'new':
          ret = evalClassInstantiation(form, env);
          break;
        case '.':
          ret = evalMemberAccess(form, env);
          break;
        case 'defmacro':
          ret = evalMacroDefinition(form, env);
          break;
        default:
          ret = evalApplication(form, env);
          break;
      }
    }
    else {
      throw new Error(s('invalid form: "', form, '"'));
    }
  }
  return ret;
}

function isArray(x) {
  return Object.prototype.toString.call(x) === '[object Array]';
}

function isRegExp(x) {
  return Object.prototype.toString.call(x) === '[object RegExp]';
}

function isDate(x) {
  return Object.prototype.toString.call(x) === '[object Date]';
}

function isObject(x) {
  return Object.prototype.toString.call(x) === '[object Object]';
}

function drop(n, l) {

}

function dropLast(l) {
  return reverse(cdr(reverse(l)));
}

function map(f, l) {
  if (isNil(l)) {
    return Nil;
  }
  else {
    var a = isArray(l) ? a : listToArray(l);
    var newA = [];
    var i;
    for (i = 0; i < a.length; i++) {
      newA.push(apply(f, list(a[i])));
    }
    return newA;
  }
}

function readJS(exp) {
  var i;
  if (isSymbol(exp)) {
    if (exp.startsWith(':') || exp.startsWith("'")) {
      return list('quote', exp.slice(1));
    }
    else if (exp.startsWith('"') && exp.endsWith('"')) {
      return list('quote', exp.slice(1).replace(/"$/, ''));
    }
    else {
      return exp;
    }
  }
  else if (isArray(exp)) {
    if (exp.length === 0) return Nil;
    var xs = Nil;
    var last = Nil, x;
    for (i = exp.length; i >= 0; i--) {
      // use & to read pairs
      if (exp[i] === '&') {
        if (exp.length === 2) return cons(Nil, readJS(last));
        i--;
        x = cons(last, readJS(exp[i]));
        if (exp.length === 3) return x;
        xs = dropLast(xs);
      }
      else {
        x = readJS(exp[i]);
      }
      xs = cons(x, xs);
      last = x;
    }
    return xs;
  }
  else if (isJSFn(exp)) return exp;
  else if (isObject(exp)) {
    var keys = Object.getOwnPropertyNames(exp);
    if (keys.length === 0) return Nil;
    var l = Nil;
    for (i = 0; i < keys.length; i++) {
      l = cons(cons(keys[i], readJS(exp[keys[i]])), l);
    }
    return list('quote', l);
  }
  else {
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

// primitive functions
define(top, "eval", evaluate);
define(top, "apply", apply);
define(top, "macroexpand", macroexpand);
define(top, "nil", Nil);
define(top, "list", list);
define(top, "cons", cons);
define(top, "count", count);
define(top, "car", car);
define(top, "cdr", cdr);
define(top, "first", car);
define(top, "rest", cdr);
define(top, "cons?", isCons);
define(top, "pair?", isPair);
define(top, "pair", pair);
define(top, "prn-str", prnStr);
define(top, "prn", prn);
define(top, "p", p);
define(top, "boolean?", isBoolean);
define(top, "symbol?", isSymbol);
define(top, "s", s);
define(top, "number?", isNumber);
define(top, "is", is);
define(top, "ok", ok);
define(top, "list->array", listToArray);
define(top, "array->list", arrayToList);
define(top, "array?", isArray);
define(top, "object->pairs", objectToPairs);
define(top, "object?", isObject);
define(top, "read-js", readJS);
define(top, "read-json", readJSON);
define(top, "reverse", reverse);

define(top, "identical?", function(a, b) { return a === b; });
define(top, "equiv?", function(a, b) { return a == b; });

define(top, "not", function(x) { return !x; });

define(top, "bit-not", function(x) { return ~x; });
define(top, "bit-and", function(a, b) { return a & b; });
define(top, "bit-or", function(a, b) { return a || b; });
define(top, "bit-shift-left", function(a, b) { return a << b; });
define(top, "bit-shift-right", function(a, b) { return a >> b; });
define(top, "unsigned-bit-shift-right", function(a, b) { return a >>> b; });

define(top, "=", eq);

var lt = function(a, b) {
  if (arguments.length === 0) {
    return lt;
  }
  else if (arguments.length === 1) {
    return function (b) {
      return a < b;
    };
  }
  else {
    return a < b;
  }
};
define(top, '<', lt);

var lteq = function(a, b) {
  if (arguments.length === 0) {
    return lteq;
  }
  else if (arguments.length === 1) {
    return function (b) {
      return a <= b;
    };
  }
  else {
    return a <= b;
  }
};
define(top, '<=', lteq);

var gt = function(a, b) {
  if (arguments.length === 0) {
    return gt;
  }
  else if (arguments.length === 1) {
    return function (b) {
      return a > b;
    };
  }
  else {
    return a > b;
  }
};
define(top, '>', gt);

var gteq = function(a, b) {
  if (arguments.length === 0) {
    return gteq;
  }
  else if (arguments.length === 1) {
    return function (b) {
      return a >= b;
    };
  }
  else {
    return a >= b;
  }
};
define(top, '>=', gteq);

var add = function() {
  if (arguments.length === 0) {
    return add;
  }
  else if (arguments.length === 1) {
    var x = 1*arguments[0];
    return function() {
      return add.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
    };
  }
  else {
    var sum = 0;
    var i;
    for (i = 0; i < arguments.length; i++) {
      sum += (1*arguments[i]);
    }
    return sum;
  }
};
define(top, "+", add);

var sub = function() {
  if (arguments.length === 0) {
    return sub;
  }
  else if (arguments.length === 1) {
    var x = -arguments[0];
    return function() {
      return sub.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
    };
  }
  else {
    var sum = 0;
    var i;
    for (i = 0; i < arguments.length; i++) {
      sum -= (1*arguments[i]);
    }
    return sum;
  }
};
define(top, '-', sub);

var mult = function() {
  if (arguments.length === 0) {
    return mult;
  }
  else if (arguments.length === 1) {
    var x = 1*arguments[0];
    return function() {
      return mult.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
    };
  }
  else {
    var sum = 1;
    var i;
    for (i = 0; i < arguments.length; i++) {
      sum *= arguments[i];
    }
    return sum;
  }
};
define(top, '*', mult);

var div = function() {
  if (arguments.length === 0) {
    return div;
  }
  else if (arguments.length === 1) {
    var x = 1*arguments[0];
    return function() {
      return div.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
    };
  }
  else {
    var sum = 1;
    var i;
    for (i = 0; i < arguments.length; i++) {
      sum /= arguments[i];
    }
    return sum;
  }
};
define(top, '/', div);

function symbolImporter(ns) {
  return function(name) {
    try {
      var val = eval(name);
      if (val != null) {
        define(top, s(ns, '/', name), val);
      }
    }
    catch (e) {
      //console.error(e);
    }
  };
}

define(top, '*platform*', 'js');

// import js stuff
[
  'Array',
  'ArrayBuffer',
  'AsyncFunction',
  'Atomics',
  'Boolean',
  'DataView',
  'Date',
  'Error',
  'EvalError',
  'Float32Array',
  'Float64Array',
  'Function',
  'Generator',
  'GeneratorFunction',
  'Infinity',
  'Int32Array',
  'Int64Array',
  'Int8Array',
  'InternalError',
  'Intl',
  'JSON',
  'Map',
  'Math',
  'NaN',
  'Number',
  'Object',
  'Promise',
  'Proxy',
  'RangeError',
  'ReferenceError',
  'Reflect',
  'RegExp',
  'Set',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'TypedArray',
  'URIError',
  'Uint16Array',
  'Uint32Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'WeakMap',
  'WeakSet',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'eval',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'uneval',
  'SIMD',
  'WebAssembly',
  'window',
  'document',
  'location',
  'localStorage',
  'console',
  'setInterval',
  'setTimeout',
  'clearInterval',
  'clearTimeout'
].forEach(symbolImporter('js'));

if (isBrowser) {
  define(top, '*platform*', 'js/browser');
}


if (isNode) {
  define(top, '*platform*', "js/node");
  [
    'Buffer',
    '__dirname',
    '__filename',
    'clearImmediate',
    'console',
    'exports',
    'global',
    'process',
    'setImmediate',
  ].forEach(symbolImporter('js.node'));
}

[
  'Attr',
  'ByteString',
  'CDATASection',
  'CharacterData',
  'ChildNode',
  'CSSPrimitiveValue',
  'CSSValue',
  'CSSValueList',
  'Comment',
  'CustomEvent',
  'Document',
  'DocumentFragment',
  'DocumentType',
  'DOMError',
  'DOMException',
  'DOMImplmentation',
  'DOMString',
  'DOMTimeStamp',
  'DOMStringList',
  'DOMTokenList',
  'Element',
  'Event',
  'EventTarget',
  'MutationObserver',
  'MutationRecord',
  'Node',
  'NodeFilter',
  'NodeIterator',
  'NodeList',
  'ParentNode',
  'ProcessingInstruction',
  'Range',
  'Text',
  'TreeWalker',
  'URL',
  'Window',
  'Worker',
  'XMLDocument',
  'HTMLAnchorElement',
  'HTMLAreaElement',
  'HTMLAudioElement',
  'HTMLBaseElement',
  'HTMLBodyElement',
  'HTMLBREElement',
  'HTMLButtonElement',
  'HTMLCanvasElement',
  'HTMLDataElement',
  'HTMLDataListElement',
  'HTMLDialogElement',
  'HTMLDivElement',
  'HTMLDListElement',
  'HTMLEmbedElement',
  'HTMLFieldSetElement',
  'HTMLFontElement',
  'HTMLFormElement',
  'HTMLFrameSetElement',
  'HTMLHeadElement',
  'HTMLHtmlElement',
  'HTMLHRElement',
  'HTMLIFrameElement',
  'HTMLImageElement',
  'HTMLInputElement',
  'HTMLKeygenElement',
  'HTMLLabelElement',
  'HTMLLIElement',
  'HTMLLinkElement',
  'HTMLMapElement',
  'HTMLMediaElement',
  'HTMLMetaElement',
  'HTMLMeterElement',
  'HTMLModElement',
  'HTMLObjectElement',
  'HTMLOListElement',
  'HTMLOptGroupElement',
  'HTMLOptionElement',
  'HTMLOutputElement',
  'HTMLParagraphElement',
  'HTMLParamElement',
  'HTMLPreElement',
  'HTMLProgressElement',
  'HTMLQuoteElement',
  'HTMLScriptElement',
  'HTMLSelectElement',
  'HTMLSourceElement',
  'HTMLSpanElement',
  'HTMLStyleElement',
  'HTMLTableElement',
  'HTMLTableCaptionElement',
  'HTMLTableCellElement',
  'HTMLTableDataCellElement',
  'HTMLTableHeaderCellElement',
  'HTMLTableColElement',
  'HTMLTableRowElement',
  'HTMLTableSectionElement',
  'HTMLTextAreaElement',
  'HTMLTimeElement',
  'HTMLTitleElement',
  'HTMLTrackElement',
  'HTMLUListElement',
  'HTMLUnknownElement',
  'HTMLVideoElement',
  'CanvasRenderingContext2D',
  'CanvasGradient',
  'CanvasPattern',
  'TextMetrics',
  'ImageData',
  'CanvasPixelArray',
  'NotifyAudioAvailableEvent',
  'HTMLFormControlsCollection',
  'HTMLOptionsCollection',
  'DOMStringMap',
  'RadioNodeList',
  'MediaError'
].forEach(symbolImporter('js.dom'));

var api = {
  eval: evaluate,
  evalJS: evalJS,
  evalJSON: evalJSON,
  readJS: readJS,
  readJSON: readJSON,
  arrayToList: arrayToList,
  listToArray: listToArray,
  objectToPairs: objectToPairs,
  isFn: isFn,
  isSymbol: isSymbol,
  Nil: Nil,
  isNil: isNil,
  isPair: isPair,
  pair: pair,
  list: list,
  prn: prn,
  prnStr: prnStr,
  ok: ok,
  is: is,
  eq: eq
};

if (isNode) {
  var fs = require('fs');
  api.evalJSONFile = function(file) {
    var ret = null;
    JSON.parse(fs.readFileSync(file).toString()).forEach(function(line) {
      ret = evalJS(line);
    });
    return ret;
  };
  module.exports = api;
}

return api;

}());

