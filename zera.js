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
    return {$car: car, $cdr: cdr, $count: 1}; // make pair
  }
  else {
    return {$car: car, $cdr: cdr, $count: count(cdr) + 1};
  }
}

function count(cons) {
  if (cons == null) {
    return 0;
  }
  else if (cons.$count != null) {
    return cons.$count;
  }
  else if (cons.length != null) {
    return cons.length;
  }
  else {
    throw new Error(s("Don't know how to get the count of: ", prnStr(cons)));
  }
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

function io(r, w) {
  return {
    read: r,
    write: w
  };
}

var stdout;
if (isNode) {
  stdout = io(
    null,
    function() { console.log(Array.prototype.slice(arguments).join('')); }
  );
}
else {
  stdout = io(
    null,
    function() { console.log(Array.prototype.slice(arguments).join('')); }
  );
}

function isIO(x) {
  return x != null && (x.read != null || x.write != null);
}

function print(x) {
  var output, io = stdout;
  if (isIO(x)) {
    io = x;
    output = Array.prototype.slice(arguments, 1).join('');
  }
  else {
    output = Array.prototype.slice(arguments).join('');
  }
  p(io);
  p(output);
  p(arguments);
  var writer = io.write;
  if (writer == null) {
    throw new Error('the IO object given is read only');
  }
  return writer.call(io, output);
}

function say() {
  return print.apply(null, [].concat(arguments, "\n"));
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
    else if (isNil(x)) {
      return '()';
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
  else if (isArray(x)) {
    if (x.length === 0) {
      return '(array)';
    }
    return s('(array ', x.map(function(x) { return prnStr(x); }).join(' '), ')');
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

function num(x) {
  var type = Object.prototype.toString.call(x);
  if (type === '[object Number]') {
    return x;
  }
  else if (type === '[object String]') {
    var x_ = 1*x;
    if (isNaN(x_)) throw new Error(s('Cannot convert: ', prnStr(x), ' to a number'));
    return x_;
  }
  else {
    throw new Error(s('Cannot convert: ', prnStr(x), ' to a number'));
  }
}

function arrayToList(a) {
  if (a.length === 0) return Nil;
  else if (a.length === 1) return cons(a[0], Nil);
  var i;
  var list = Nil;
  for (i = a.length - 1; i >= 0; i--) {
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
    throw new Error(s('cond requires an even number of predicates: ', prnStr(form)));
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

function bindArguments(names, values) {
  if (isPair(names)) {
    if (isNil(car(names))) {
      return  [[cdr(names), values]];
    }
    else {
      return [
        [car(names), car(values)],
        [cdr(names), cdr(values)]
      ];
    }
  }
  else {
    var i, binds = [];
    var names_  = listToArray(names);
    var values_ = listToArray(values);
    for (i = 0; i < names_.length; i++) {
      if (isPair(names_[i])) {
        binds.push([car(names_[i]), values_[i]]);
        binds.push([cdr(names_[i]), arrayToList(values_.slice(i + 1))]);
      }
      else {
        binds.push([names_[i], values_[i]]);
      }
    }
    return binds;
  }
}

function calculateArity(args) {
  if (isPair(args)) {
    if (isNil(car(args))) return -1;
    else {
      return -2;
    }
  }
  var args_ = listToArray(args);
  var argc  = args_.length;
  var i;
  for (i = 0; i < argc; i++) {
    if (isPair(args_[i])) {
      return -1 * argc;
    }
  }
  return argc;
}

/*
prn(bindArguments(list('x'), list(1)));
prn(bindArguments(list('x', 'y'), list(1, 2)));
prn(bindArguments(cons('x', 'xs'), list(1, 2)));
prn(bindArguments(list('x', cons('y', 'ys')), list(1, 2, 3, 4, 5)));
*/

// add capture variables using pair notation
function apply(x, args) {
  if (isJSFn(x)) {
    return x.apply(null, listToArray(args));
  }
  if (!isFn(x)) {
    throw new Error(s('Not a valid function: ', prnStr(x), ''));
  }
  var fn    = car(x);
  var env   = cdr(x);
  var rest  = cdr(fn);
  var names = car(rest);
  var body  = cdr(rest);

  if (isNil(body)) return Nil;

  var namec = calculateArity(names);
  var argc  = count(args);
  if (namec < 0 && argc < (Math.abs(namec) - 1)) {
    throw new Error(s('Wrong number of arguments, expected at least: ', Math.abs(namec) - 1, ', got: ', argc));
  }
  else if (namec > 0 && namec !== argc) {
    throw new Error(s('Wrong number of arguments, expected: ', namec, ', got: ', argc));
  }

  // bind arguments
  var binds = bindArguments(names, args);
  for (var i = 0; i < binds.length; i++) {
    var name  = binds[i][0];
    var value = binds[i][1];
    define(env, name, value);
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
  var arr = map(function(x) { return evaluate(x, env); }, args);
  if (isJSFn(fn)) {
    return fn.apply(null, arr);
  }
  var args_ = arrayToList(arr);
  return apply(fn, args_);
}

function evalFunction(form, env_) {
  //prn(form);
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
  var args = map(function(x) {
    return evaluate(x, env);
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
        for (i = 0; i < names.length; i++) {
          define(scope, names[i], e.args[i]);
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

function readJSArray(exp) {
  if (exp.length === 0) return Nil;
  if (exp.length === 1) return cons(readJS(exp[0]), Nil);
  var xs = Nil;
  var last = Nil, x;
  for (i = exp.length - 1; i >= 0; i--) {
    // use & to read pairs
    if (exp[i] === '&') {
      if (exp.length === 2) return cons(Nil, readJS(last));
      i--;
      x = cons(readJS(exp[i]), last);
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
    if (exp.length === 1) return cons(readJS(exp[0]), Nil);
    var xs = Nil;
    var last = Nil, x;
    for (i = exp.length - 1; i >= 0; i--) {
      // use & to read pairs
      if (exp[i] === '&') {
        if (exp.length === 2) return cons(Nil, readJS(last));
        i--;
        x = cons(readJS(exp[i]), last);
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

var readString = (function() {

  function inputStream(input, source) {
    var pos = 0, line = 1, col = 0;

    return {
      next: next,
      prev: prev,
      peek: peek,
      peekAhead: peekAhead,
      eof: eof,
      croak: croak,
      source: function() { return source; },
      line: function() { return line; },
      column: function() { return col; }
    };

    function next() {
      var ch = input.charAt(pos++);
      if (ch === "\n") {
        line++;
        col = 0;
      }
      else {
        col++;
      }
      return ch;
    }

    function prev() {
      var ch = input.charAt(pos--);
      if (ch === "\n") {
        line--;
        col = 0;
      }
      else {
        col--;
      }
      return ch;
    }

    function peek() {
      return input.charAt(pos);
    }

    function peekAhead() {
      return input.charAt(pos + 1);
    }

    function eof() {
      return peek() === '';
    }

    function croak(msg) {
      throw new Error(msg + " at (" + line + ":" + col + ")");
    }
  }

  var WHITESPACE_CHARS = {
    " ": true,
    "\n": true,
    "\t": true,
    ",": true
  };

  var COLLECTION_START = {
    '(': 'list',
    /*'[': 'vector',
    '{': 'map',
    '#': 'set'*/
  };

  var COLLECTION_END = {
    '(': ')',
    /*'[': ']',
    '{': '}',
    '#': '}',*/
  };

  var COLLECTION_END_NAME = {
    ')': 'list',
    /*']': 'vector',
    '}': 'map',*/
    //'}': 'set',
  };

  var ESCAPE_CHARS = {
    n: "\n",
    r: "\r",
    t: "\t",
    v: "\v",
    b: "\b",
    f: "\f"
  };

  function tokenStream(input) {
    var current = null;
    return {
      next: next,
      peek: peek,
      eof: eof,
      source: input.source,
      line: input.line,
      column: input.column,
      croak: input.croak
    };

    function isDigit(ch) {
      return /[0-9\_\,]/.test(ch);
    }

    function isWhitespace(ch) {
      return !!WHITESPACE_CHARS[ch];
    }

    function isSymbol(ch) {
      return /[a-zA-Z0-9\_\.\/\-\!\?\*\$\=\<\>\+\~\|\%]/.test(ch);
    }

    function isChar(ch) {
      return isSymbol(ch);
    }

    function isKeywordStart(ch) {
      return ch === ':';
    }

    function isCollStart(ch) {
      return !!COLLECTION_START[ch];
    }

    function readWhile(pred) {
      var buffer = [];
      while (!input.eof() && pred(input.peek())) {
        buffer.push(input.next());
      }
      return buffer.join('');
    }

    function skipComment() {
      readWhile(function(ch) { return ch != "\n" });
      input.next();
    }

    function readEscaped(end) {
      var escaped = false, buffer = [], xf;
      input.next();
      while (!input.eof()) {
        var ch = input.next();
        if (escaped) {
          if (xf = ESCAPE_CHARS[ch]) {
            buffer.push(xf);
          }
          else {
            buffer.push(ch);
          }
          escaped = false;
        }
        else if (ch == "\\") {
          escaped = true;
        }
        else if (ch == end) {
          break;
        }
        else {
          buffer.push(ch);
        }
      }
      return buffer.join('');
    }

    function readString() {
      return list('quote', readEscaped('"'));
    }

    function readNumber(hasSign) {
      var hasDot = false;
      var sign = hasSign ? input.next() : null;
      var num = readWhile(function(ch) {
        if (ch === '.') {
          if (hasDot) throw new Error("unexpexted '.'");
          hasDot = true;
          return true;
        }
        if (hasSign && (ch === '-' || ch === '+')) {
          throw new Error(s("unexpected '", ch, "'"));
        }
        return isDigit(ch);
      });
      num = s(sign, num.replace(/[,_]/g, ''));
      return hasDot ? parseFloat(num) : parseInt(num);
    }

    function readSymbol() {
      var sym = readWhile(isSymbol);
      if (sym === 'true' || sym === 'false') {
        return sym === 'true' ? true : false;
      }
      else if (sym === 'nil') {
        return Nil;
      }
      else {
        return sym;
      }
    }

    function readKeyword() {
      input.next();
      var head = '';
      if (input.peek() === ':') {
        head = input.peek();
        input.next();
      }
      var kw = readWhile(isSymbol);
      return list('quote', s(head, kw));
    }

    function readChar() {
      input.next();
      var head = '';
      if (input.peek() === '\\') {
        head = input.peek();
        input.next();
      }
      var ch = readWhile(isChar);
      if (ch.length !== 1) {
        if (ch === 'newline') {
          ch = "\n";
        }
        else if (ch === 'space') {
          ch = " ";
        }
        else if (ch === 'tab') {
          ch = "\t";
        }
        else if (ch === 'return') {
          ch = "\r";
        }
        else if (ch === 'formfeed') {
          ch = "\f";
        }
        else if (ch === 'backspace') {
          ch = "\b";
        }
        else if (ch.startsWith('u')) {
          var u = ['0x', ch.slice(1)].join('');
          ch = String.fromCharCode(1*u);
        }
        else {
          throw new Error(s('invalid character: "', ch, '"'));
        }
      }
      return list('quote', s(head, ch));
    }

    function readList() {
      var buffer = [];
      while (!input.eof()) {
        var ch = input.next();
        if (ch === ')' || input.peek() === ')') {
          break;
        }
        else if (input.peek() === '&') {
          buffer.push(input.next());
        }
        /*else if (ch === '&' || input.peek() === '&') {
          var last = buffer.pop();
          input.next();
          if (last == null) {
            buffer.push(cons(Nil, readNext()));
          }
          else {
            buffer.push(cons(last, readNext()));
          }
        }*/
        else {
          buffer.push(readNext());
        }
      }
      //return readJS(buffer);
      
      if (buffer.length === 0) return Nil;
      if (buffer.length === 1) return cons(buffer[0], Nil);
      var xs = Nil, i;
      var last = Nil, x;
      for (i = buffer.length - 1; i >= 0; i--) {
        // use & to read pairs
        if (buffer[i] === '&') {
          if (buffer.length === 2) return cons(Nil, last);
          i--;
          x = cons(buffer[i], last);
          if (buffer.length === 3) return x;
          xs = dropLast(xs);
        }
        else {
          x = buffer[i];
        }
        xs = cons(x, xs);
        last = x;
      }
      //return xs;
      return xs;
    }

    function readQuotedForm() {
      input.next();
      return list('quote', readNext());
    }

    function expandList(col, env) {
      return col;
    }

    function readUnquoted() {
      input.next();
      if (input.peek() === '@') {
        input.next();
        return _.list(_.symbol('unquote-splicing'), readNext());
      }
      return _.list(_.symbol('unquote'), readNext());
    }

    function readSyntaxQuote(exp, env) {
      var form = _.second(exp);
      if (_.isList(form)) {
        return _.reverse(
          _.into(
            _.list(),
            _.map(expandList(form), function(x) {
              if (isUnquoteSpliced(x)) {
                throw new Error('splice not in list');
              }
              else if (isUnquoted(x)) {
                return _.second(x);
              }
              else if (_.isList(x)) {
                return readSyntaxQuote(x, env);
              }
              else {
                return x;
              }
        })));
      }
      else {
        return form;
      }
    }

    function readSyntaxQuotedForm() {
      input.next();
      return readSyntaxQuote(readNext());
    }

    function readDerefForm() {
      input.next();
      return list('deref', readNext());
    }

    function readNext() {
      readWhile(isWhitespace);
      if (input.eof()) return null;
      var ch = input.peek();
      var exp;
      if (ch === ";") {
        skipComment();
        exp = readNext();
      }
      else if (ch === '"') {
        exp = readString();
      }
      else if (/[0-9]/.test(ch) || (ch === '-' || ch === '+') && isDigit(input.peekAhead())) {
        exp = readNumber(ch === '-' || ch === '+');
      }
      else if (isSymbol(ch)) {
        exp = readSymbol();
      }
      else if (ch === ':') {
        exp = readKeyword();
      }
      else if (ch === "'") {
        exp = readQuotedForm();
      }
      /*else if (ch === '~') {
        return readUnquoted();
      }
      else if (ch === "`") {
        return readSyntaxQuotedForm();
      }*/
      /*else if (ch === "@") {
        exp = readDerefForm();
      }*/
      else if (ch === '\\') {
        exp = readChar();
      }
      else if (ch === '(') {
        exp = readList();
      }
      else if (!!COLLECTION_END_NAME[ch]) {
        input.next();
        exp = readNext();
      }

      if (exp === void(0)) {
        input.croak("Can't handle character: '" + ch + "'");
      }
      else {
        return exp;
      }
    }

    function peek() {
      return current || (current = readNext());
    }

    function next() {
      var token = current;
      current = null;
      return token || readNext();
    }

    function eof() {
      return peek() == null;
    }
  }

  return function(str, input) {
    if (str == null || typeof str !== 'string') return [];
    var tokens = [];
    return tokenStream(inputStream(str, input || 'string-input'));
  };
}());


function evalJS(exp) {
  return evaluate(readJS(exp));
}

function evalJSON(json) {
  return evaluate(readJSON(json));
}

function evalString(string) {
  var stream = readString(string);
  var val = null;
  while (!stream.eof()) {
    val = evaluate(stream.next());
  }
  return val;
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
define(top, "num", num);
define(top, "is", is);
define(top, "ok", ok);
define(top, "list->array", listToArray);
define(top, "array->list", arrayToList);
define(top, "array?", isArray);
define(top, "array", function() { return Array.prototype.slice.call(arguments); });
define(top, "object->pairs", objectToPairs);
define(top, "object?", isObject);
define(top, "read-js", readJS);
define(top, "read-json", readJSON);

define(top, "io", io);
define(top, "io?", isIO);
define(top, "stdout", stdout);
define(top, "print", print);
define(top, "say", say);

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
    var x = num(arguments[0]);
    return function() {
      return add.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
    };
  }
  else {
    var sum = 0;
    var i;
    for (i = 0; i < arguments.length; i++) {
      sum += num(arguments[i]);
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
    var x = -num(arguments[0]);
    return function() {
      return sub.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
    };
  }
  else {
    var sum = 0;
    var i;
    for (i = 0; i < arguments.length; i++) {
      sum -= num(arguments[i]);
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
    var x = num(arguments[0]);
    return function() {
      return mult.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
    };
  }
  else {
    var sum = 1;
    var i;
    for (i = 0; i < arguments.length; i++) {
      sum *= num(arguments[i]);
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
    var x = num(arguments[0]);
    return function() {
      return div.apply(null, [].concat(x, Array.prototype.slice.call(arguments)));
    };
  }
  else {
    var sum = 1;
    var i;
    for (i = 0; i < arguments.length; i++) {
      sum /= num(arguments[i]);
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
  evalString: evalString,
  readJS: readJS,
  readJSON: readJSON,
  readString: readString,
  arrayToList: arrayToList,
  listToArray: listToArray,
  objectToPairs: objectToPairs,
  isFn: isFn,
  isSymbol: isSymbol,
  isBoolean: isBoolean,
  isNumber: isNumber,
  isAtom: isAtom,
  Nil: Nil,
  isNil: isNil,
  isCons: isCons,
  cons: cons,
  count: count,
  car: car,
  cdr: cdr,
  isPair: isPair,
  pair: pair,
  list: list,
  first: car,
  rest: cdr,
  prn: prn,
  prnStr: prnStr,
  ok: ok,
  is: is,
  eq: eq,
  num: num,
  s: s
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

  api.evalFile = function(file) {
    return evalString(fs.readFileSync(file).toString());
  };

  module.exports = api;
}

return api;

}());
