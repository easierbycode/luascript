var Lua = require("lib/lua.js");

exports.testArithmeticExpressions = function(test){
  test.strictEqual(3, Lua.evalText("return 1+2"));
  test.strictEqual(0, Lua.evalText("return 1+(2-3)"));
  test.strictEqual(-2, Lua.evalText("return -1+(2-3)"));
  test.strictEqual(-10, Lua.evalText("return 10*(2-3)"));
  test.strictEqual(-10, Lua.evalText("return 10/(2-3);"));
  test.strictEqual(5, Lua.evalText("a = 10/(2-3); return 2+3"));
  test.done();
};

exports.testBooleansAndNil = function(test) {
  // Default return value needs to be nil
  test.strictEqual(null, Lua.evalText("b = 1 + 2"));
  test.strictEqual(null, Lua.evalText("return nil"));
  test.strictEqual(true, Lua.evalText("return true"));
  test.strictEqual(false, Lua.evalText("return false"));
  test.done();
}

exports.testAnonymousFunctions = function(test) {
  var fun;

  // Test simple case
  fun = Lua.evalText("return function ()\nreturn 1\nend");
  test.strictEqual(1, fun());

  // Default return value must be nil
  fun = Lua.evalText("return function ()\n b = 1\nend");
  test.strictEqual(null, fun());

  // Default return value must be nil even for empty functions
  fun = Lua.evalText("return function ()\n end");
  test.strictEqual(null, fun());

  // Default return value must be nil even for empty functions with several line breaks
  fun = Lua.evalText("return function ()\n\n\nend");
  test.strictEqual(null, fun());

  // Now with args
  fun = Lua.evalText("return function (a, b)\nreturn a + b\nend");
  test.strictEqual(3, fun(1, 2));

  // Now with line break between args
  fun = Lua.evalText("return function (a,\nb)\nreturn a + b\nend");
  test.strictEqual(3, fun(1, 2));

  test.done();
}

exports.testFunctionCalls = function(test) {
  var fun;
  test.strictEqual(1, Lua.evalText("return (function ()\nreturn 1\nend)()"));
  test.strictEqual(1, Lua.evalText("return (function ()\nreturn (function ()\nreturn 1\nend)\nend)()()"));
  test.done();
}

exports.testAssignments = function(test) {
  // 1 x 1
  test.strictEqual(3, Lua.evalText("a = 1 + 2; return a"));

  // 2 x 1
  test.strictEqual(3, Lua.evalText("a, b = 1 + 2; return a"));
  test.strictEqual(null, Lua.evalText("a, b = 1 + 2; return b"));

  // 2 x 2
  test.strictEqual(3, Lua.evalText("a, b = 1 + 2, 3 + 5; return a"));
  test.strictEqual(8, Lua.evalText("a, b = 1 + 2, 3 + 5; return b"));

  // 2 x 2 parallel
  test.strictEqual(2, Lua.evalText("a, b = 1, 2; a, b = b, a; return a"));
  test.strictEqual(1, Lua.evalText("a, b = 1, 2; a, b = b, a; return b"));

  // 2 x 4 parallel
  test.strictEqual(0,    Lua.evalText("x = 0\nf = function()\nx = x + 1\nend\na, b = x, f(), f()\nreturn a"));
  test.strictEqual(null, Lua.evalText("x = 0\nf = function()\nx = x + 1\nend\na, b = x, f(), f()\nreturn b"));
  test.strictEqual(2,    Lua.evalText("x = 0\nf = function()\nx = x + 1\nend\na, b = x, f(), f()\nreturn x"));
  test.done();
}

exports.testGlobalVar = function(test) {
  test.equal(Object, Lua.evalText("return _G").constructor);
  test.done();
}