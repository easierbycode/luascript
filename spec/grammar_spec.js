require("lib/lua.js");

exports.testArithmeticExpressions = function(test){
  test.strictEqual(3, Lua.evalText("return 1+2"));
  test.strictEqual(0, Lua.evalText("return 1+(2-3)"));
  test.strictEqual(-2, Lua.evalText("return -1+(2-3)"));
  test.strictEqual(-10, Lua.evalText("return 10*(2-3)"));
  test.strictEqual(-10, Lua.evalText("return 10/(2-3);"));
  test.strictEqual(-5, Lua.evalText("return -10-(-2-\n3);"));
  test.strictEqual(5, Lua.evalText("a = 10/(2-3); return 2+3"));

  a = undefined;
  test.done();
};

exports.testBooleansAndNil = function(test) {
  // Default return value needs to be nil
  test.strictEqual(null, Lua.evalText("b = 1 + 2"));
  test.strictEqual(null, Lua.evalText("return nil"));
  test.strictEqual(true, Lua.evalText("return true"));
  test.strictEqual(false, Lua.evalText("return false"));

  b = undefined;
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

  b = undefined;
  test.done();
}

exports.testNamedFunctions = function(test) {
  // Global named function
  test.strictEqual(3, Lua.evalText("function x(a, b)\nreturn a+b\nend\nreturn x(1,2)"));

  // Local named function
  x = undefined;
  test.strictEqual(3, Lua.evalText("local function x(a, b)\nreturn a+b\nend\nreturn x(1,2)"));
  x = undefined;
  test.strictEqual(undefined, Lua.evalText("do\nlocal function x(a, b)\nreturn a+b\nend\nend\nreturn x"));

  x = undefined;
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

  a = undefined; b = undefined; x = undefined; f = undefined;
  test.done();
}

exports.testGlobalVar = function(test) {
  test.equal(Object, Lua.evalText("return _G").constructor);
  test.done();
}

exports.testLocalVar = function(test) {
  // Shadowing
  test.strictEqual(1, Lua.evalText("x = 0\nf = function()\nlocal x = 1\nreturn x\nend\nreturn f()"));
  test.strictEqual(0, Lua.evalText("x = 0\nf = function()\nlocal x = 1\nreturn x\nend\nz = f()\nreturn x"));

  // 3 x 0 parallel
  test.strictEqual(null, Lua.evalText("local a, b, c\nreturn a"));
  test.strictEqual(null, Lua.evalText("local a, b, c\nreturn b"));
  test.strictEqual(null, Lua.evalText("local a, b, c\nreturn c"));

  // 2 x 2 parallel
  test.strictEqual(1, Lua.evalText("local a, b = 1, 2\nreturn a"));
  test.strictEqual(2, Lua.evalText("local a, b = 1, 2\nreturn b"));

  // 2 x 4 parallel
  test.strictEqual(0,    Lua.evalText("x = 0\nf = function()\nx = x + 1\nend\nlocal a, b = x, f(), f()\nreturn a"));
  test.strictEqual(null, Lua.evalText("x = 0\nf = function()\nx = x + 1\nend\nlocal a, b = x, f(), f()\nreturn b"));
  test.strictEqual(2,    Lua.evalText("x = 0\nf = function()\nx = x + 1\nend\nlocal a, b = x, f(), f()\nreturn x"));

  a = undefined; b = undefined; x = undefined; f = undefined;
  test.done();
}

exports.testDoEnd = function(test) {
  // Local and global variables in while
  test.strictEqual(0, Lua.evalText("x = 0\ndo\nlocal x = 1\nend\nreturn x"));
  test.strictEqual(2, Lua.evalText("x = 0\ndo\nx = 2\nend\nreturn x"));

  // Return
  test.strictEqual(10, Lua.evalText("do\nreturn 10\nend"));

  // Assigning an external global variable to a local variable should work
  test.strictEqual(3, Lua.evalText("x = 1\na = 2\ndo\nlocal x = x\na = a + x\nend\nreturn a"));

  a = undefined; x = undefined;
  test.done();
}

exports.testWhile = function(test) {
  // Local and global variables in while
  test.strictEqual(undefined, Lua.evalText("x = true\nwhile x do\nx = false\nlocal a = 1\nend\nreturn a"));
  test.strictEqual(null,      Lua.evalText("x = 0\nwhile x do\nx = nil\nlocal a = 1\nend\nreturn x"));

  // Return
  test.strictEqual(10, Lua.evalText("while true do\nreturn 10\nend"));

  // Break
  test.strictEqual(true, Lua.evalText("while true do\nx = true;break;x = false\nend\nreturn x"));
  test.strictEqual(true, Lua.evalText("while 0 do\nx = true;break;x = false\nend\nreturn x"));

  x = undefined;
  test.done();
}

exports.testRepeat = function(test) {
  // Local and global variables in while
  test.strictEqual(undefined, Lua.evalText("x = false\nrepeat\nx = true\nlocal a = 1\nuntil x\nreturn a"));
  test.strictEqual(true,      Lua.evalText("repeat\nx = true\nlocal a = true\nuntil a\nreturn x"));
  test.strictEqual(0,         Lua.evalText("x = nil\nrepeat\nx = 0\nlocal a = 1\nuntil x\nreturn x"));

  // Return
  test.strictEqual(10, Lua.evalText("repeat\nreturn 10\nuntil false"));

  // Break
  test.strictEqual(true, Lua.evalText("repeat\nx = true;break;x = false\nuntil false\nreturn x"));
  test.strictEqual(true, Lua.evalText("repeat\nx = true;break;x = false\nuntil nil\nreturn x"));

  x = undefined;
  test.done();
}

// exports.testAllowFunctionCallAsStatement = function(test) {
//   test.strictEqual(1, Lua.evalText("x = 0\na = function()\nx = x + 1\nend\na()\nreturn x"));
//   test.done();
// }