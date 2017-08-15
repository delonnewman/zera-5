var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
if (isNode) {
  var zera = require('./zera.js');
}

var zera = zera || {};
zera.test = (function() {

var z        = zera;
var ok       = z.ok;
var is       = z.is;
var eq       = z.eq;
var isNil    = z.isNil;
var Nil      = z.Nil;
var isSymbol = z.isSymbol;
var list     = z.list;
var isPair   = z.isPair;
var isFn     = z.isFn;

ok(isNil(null),   '(nil? null)');
ok(isNil(Nil),    '(nil? nil)');
ok(!isNil(1),     '(nil? 1)');
ok(isSymbol("x"), '(symbol? x)');

is(true,  eq(1, 1),                         '(= 1 1)');
is(false, eq(1, 2),                         '(= 1 2)');
is(true,  eq("test", "test"),               '(= "test" "test")');
is(true,  eq(list(1, 2, 3), list(1, 2, 3)), '(= (1 2 3) (1 2 3))');

is(1,             z.eval(list("quote", 1)),           "'1");
ok(eq(list(1, 2), z.eval(list("quote", list(1, 2)))), "'(1 2 3)");

is(1, z.eval(list("def", "x", 1)),  '(def x 1)');
is(1, z.eval("x"),                  '(= x 1)');
is(2, z.eval(list("set!", "x", 2)), '(set! x 2)');
is(2, z.eval("x"),                  '(= x 2)');
is(2, z.eval(list("cond", 1, "x")), '(cond 1 x)');
is(2, z.eval(list("cond", Nil, 1, "else", "x")), '(cond nil 1 else x)');

ok(isPair(z.eval(list("fn", list(), 1))), '(pair? (fn () 1))');
ok(isFn(z.eval(list("fn", list(), 1))),   '(fn? (fn () 1))');

is(2, z.eval(list(list("fn", list(), "x"))), '((fn () x))');
is(2, z.eval(list(function(){ return 2; })), 'function() { return 2 }');

is(2, z.eval(list('+', 1, 1)), '(+ 1 1)');
is(3, z.eval(list('+', 1, 'x')), '(+ 1 x)');
is(3, z.eval(list(list('+', 1), 'x')), '((+ 1) x)');
is(10, z.eval(list('+', 1, 2, 3, 4)), '(+ 1 2 3 4)');

is(1, z.eval(list("loop", list(), 1)), '(loop () 1)');
is(1, z.eval(list("loop", list('i', 1), 'i')), '(loop (i 1) i)');

//z.eval(list('recur', 1));

var xs = z.eval(
  list('loop', list('xs', 'nil', 'i', 0),
    list('cond',
      list('=', 'i', 10), 'xs',
      'else',
        list('recur', list('cons', 'i', 'xs'), list('+', 'i', 1)))));

ok(eq(xs, list(9, 8, 7, 6, 5, 4, 3, 2, 1, 0)), '(loop (xs nil, i 0) (cond (= i 10) xs else (recur (cons i xs) (+ i 1))))');

is(3, z.eval(list(list('fn', list('x'), 'x'), 3)), '((fn (x) x) 3)');

}());
