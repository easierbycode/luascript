var Lua = require("lib/lua.js");

exports.testArithmeticExpressions = function(test){
  test.strictEqual(3, Lua.evalText("return 1+2"));
  test.strictEqual(0, Lua.evalText("return 1+(2-3)"));
  test.strictEqual(-2, Lua.evalText("return -1+(2-3)"));
  test.strictEqual(-10, Lua.evalText("return 10*(2-3)"));
  test.strictEqual(-10, Lua.evalText("return 10/(2-3);"));
  test.strictEqual(5, Lua.evalText("10/(2-3); return 2+3"));
  test.done();
};

exports.testBooleansAndNil = function(test) {
  // Default return value needs to be nil
  test.strictEqual(null, Lua.evalText("1 + 2"));
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
  fun = Lua.evalText("return function ()\n 1\nend");
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