require("lib/lua.js");

exports.testArithmeticExpressions = function(test){
  test.strictEqual(3, Lua.evalText("return 1+2"));
  test.strictEqual(0, Lua.evalText("return 1+(2-3)"));
  test.strictEqual(0, Lua.evalText("return 1+(\n2-\n3\n)"));
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
  fun = Lua.evalText("return function ()\nb = 1\nend");
  test.strictEqual(null, fun());

  // Default return value must be nil even for empty functions
  fun = Lua.evalText("return function ()\nend");
  test.strictEqual(null, fun());

  // Default return value must be nil even for empty functions with several line breaks
  fun = Lua.evalText("return function ()\n\n\nend");
  test.strictEqual(null, fun());

  // We can skip "return null" if a return is added
  // If no return, no need to wrap the block.
  test.strictEqual(false, !!Lua.translateText("return function (a, b)\nreturn a + b\nend").match("return null"));
  test.strictEqual(true,  !!Lua.translateText("return function (a, b)\nc = 10\nend").match("return null"));

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

  // Check returnWrapper in wrapper function.
  // If no return, no need to wrap the block.
  test.strictEqual(false, !!Lua.translateText("do\na = 10\nend").match("returnWrapper"));
  test.strictEqual(true,  !!Lua.translateText("do\nreturn 10\nend").match("returnWrapper"));

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

exports.testIf = function(test) {
  // Local and global variables in while
  test.strictEqual(undefined, Lua.evalText("x = true\nif true then\nx = false\nlocal a = 1\nend\nreturn a"));
  test.strictEqual(null,      Lua.evalText("x = 0\nif true then\nx = nil\nlocal a = 1\nend\nreturn x"));

  // Else
  test.strictEqual(undefined, Lua.evalText("x = true\nif false then\nelse\nx = false\nlocal a = 1\nend\nreturn a"));
  test.strictEqual(null,      Lua.evalText("x = 0\nif false then\nelse\nx = nil\nlocal a = 1\nend\nreturn x"));

  // Elsif
  test.strictEqual(undefined, Lua.evalText("x = true\nif false then\nelseif true then\nx = false\nlocal a = 1\nend\nreturn a"));
  test.strictEqual(null,      Lua.evalText("x = 0\nif false then\nelseif true then\nx = nil\nlocal a = 1\nend\nreturn x"));

  // Return
  test.strictEqual(10, Lua.evalText("if true then\nreturn 10\nend"));
  test.strictEqual(20, Lua.evalText("if nil then\nreturn 10\nelse\nreturn 20\nend"));
  test.strictEqual(20, Lua.evalText("if false then\nreturn 10\nelse\nreturn 20\nend"));

  x = undefined;
  test.done();
}

exports.testELLIPSIS = function(test) {
  // With binops
  test.strictEqual(3, Lua.evalText("function x(a, b, ...)\nreturn a + 2\nend\nreturn x(1,2,3)"));
  test.strictEqual(4, Lua.evalText("function x(a, b, ...)\nreturn b + 2\nend\nreturn x(1,2,3)"));
  test.strictEqual(5, Lua.evalText("function x(a, b, ...)\nreturn ... + 2\nend\nreturn x(1,2,3)"));
  test.strictEqual(5, Lua.evalText("function x(a, b, ...)\nreturn ... + 2\nend\nreturn x(1,2,3,4)"));

  // Invalid
  test.throws(function(){
    Lua.translateText("function x(a, b)\nreturn ...\nend");
  }, "cannot use '...' outside a vararg function");

  // With funcalls
  f = function (a, b, c) { return a + b - c; }
  test.strictEqual(2, Lua.evalText("function x(a, b, ...)\nreturn f(...)\nend\nreturn x(1,2,3,4,5)"));
  test.strictEqual(5, Lua.evalText("function x(a, b, ...)\nreturn f(..., b)\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(0, Lua.evalText("function x(a, b, ...)\nreturn f(a, ...)\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(2, Lua.evalText("function x(a, b, ...)\nreturn f(a, ..., b)\nend\nreturn x(1,2,3)"));
  test.strictEqual(2, Lua.evalText("function x(a, b, ...)\nreturn f(..., ...)\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(2, Lua.evalText("function x(a, b, ...)\nreturn f(..., ...)\nend\nreturn x(1,2,3,4,5)"));

  // Invalid
  test.throws(function(){
    Lua.translateText("function x(a, b)\nreturn f(...)\nend");
  }, "cannot use '...' outside a vararg function");

  f = undefined; x = undefined;
  test.done();
}

exports.testELLIPSISAssignments = function(test) {
  // Invalid
  test.throws(function(){
    Lua.translateText("function x(a, b)\na = ...\nend");
  }, "cannot use '...' outside a vararg function");

  test.throws(function(){
    Lua.translateText("function x(a, b)\na, b = ...\nend");
  }, "cannot use '...' outside a vararg function");

  test.throws(function(){
    Lua.translateText("function x(a, b)\na, b = 1, ...\nend");
  }, "cannot use '...' outside a vararg function");

  // 1 x 1
  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a = ...\nreturn a\nend\nreturn x(1)"));
  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a = ...\nreturn a\nend\nreturn x(1,2)"));
  test.strictEqual(1, Lua.evalText("function x(...)\nlocal arguments = nil\nlocal a = ...\nreturn a\nend\nreturn x(1,2)"));
  test.strictEqual(10, Lua.evalText("arguments = 10\nfunction this()\nreturn arguments\nend\nreturn this()"));

  // 2 x 2
  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a, b = 1, ...\nreturn a\nend\nreturn x(2)"));
  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b = 1, ...\nreturn b\nend\nreturn x(2)"));

  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a, b = 1, ...\nreturn a\nend\nreturn x(2,3)"));
  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b = 1, ...\nreturn b\nend\nreturn x(2,3)"));

  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b = ..., 1\nreturn a\nend\nreturn x(2,3)"));
  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a, b = ..., 1\nreturn b\nend\nreturn x(2,3)"));

  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b = ..., ...\nreturn a\nend\nreturn x(2,3)"));
  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b = ..., ...\nreturn b\nend\nreturn x(2,3)"));

  // 2 x 4
  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a, b = 1, ..., 3, 4\nreturn a\nend\nreturn x(2)"));
  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b = 1, ..., 3, 4\nreturn b\nend\nreturn x(2)"));

  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a, b = 1, ..., 3, 4\nreturn a\nend\nreturn x(2,3)"));
  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b = 1, ..., 3, 4\nreturn b\nend\nreturn x(2,3)"));

  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b = ..., 4, 5, 6\nreturn a\nend\nreturn x(2,3)"));
  test.strictEqual(4, Lua.evalText("function x(...)\nlocal a, b = ..., 4, 5, 6\nreturn b\nend\nreturn x(2,3)"));

  // 4 x 2
  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a, b, c, d = ...\nreturn a\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b, c, d = ...\nreturn b\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(3, Lua.evalText("function x(...)\nlocal a, b, c, d = ...\nreturn c\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(4, Lua.evalText("function x(...)\nlocal a, b, c, d = ...\nreturn d\nend\nreturn x(1,2,3,4)"));

  test.strictEqual(2, Lua.evalText("function x(e, ...)\nlocal a, b, c, d = ...\nreturn a\nend\nreturn x(1,2,3,4,5)"));
  test.strictEqual(3, Lua.evalText("function x(e, ...)\nlocal a, b, c, d = ...\nreturn b\nend\nreturn x(1,2,3,4,5)"));
  test.strictEqual(4, Lua.evalText("function x(e, ...)\nlocal a, b, c, d = ...\nreturn c\nend\nreturn x(1,2,3,4,5)"));
  test.strictEqual(5, Lua.evalText("function x(e, ...)\nlocal a, b, c, d = ...\nreturn d\nend\nreturn x(1,2,3,4,5)"));

  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a, b, c, d = ..., 5, 6\nreturn a\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b, c, d = ..., 5, 6\nreturn b\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(5, Lua.evalText("function x(...)\nlocal a, b, c, d = ..., 5, 6\nreturn c\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(6, Lua.evalText("function x(...)\nlocal a, b, c, d = ..., 5, 6\nreturn d\nend\nreturn x(1,2,3,4)"));

  test.strictEqual(0, Lua.evalText("function x(...)\nlocal a, b, c, d = 0, ..., 5\nreturn a\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a, b, c, d = 0, ..., 5\nreturn b\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b, c, d = 0, ..., 5\nreturn c\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(5, Lua.evalText("function x(...)\nlocal a, b, c, d = 0, ..., 5\nreturn d\nend\nreturn x(1,2,3,4)"));

  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a, b, c, d = ..., ...\nreturn a\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(1, Lua.evalText("function x(...)\nlocal a, b, c, d = ..., ...\nreturn b\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(2, Lua.evalText("function x(...)\nlocal a, b, c, d = ..., ...\nreturn c\nend\nreturn x(1,2,3,4)"));
  test.strictEqual(3, Lua.evalText("function x(...)\nlocal a, b, c, d = ..., ...\nreturn d\nend\nreturn x(1,2,3,4)"));

  x = undefined;
  test.done();
}

// exports.testAllowFunctionCallAsStatement = function(test) {
//   test.strictEqual(1, Lua.evalText("x = 0\na = function()\nx = x + 1\nend\na()\nreturn x"));
//   test.done();
// }