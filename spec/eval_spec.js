var Lua = require("lib/lua.js");

exports.testArithmeticExpressions = function(test){
  test.equal(3, Lua.evalText("return 1+2"));
  test.equal(0, Lua.evalText("return 1+(2-3)"));
  test.equal(-2, Lua.evalText("return -1+(2-3)"));
  test.equal(-10, Lua.evalText("return 10*(2-3)"));
  test.equal(-10, Lua.evalText("return 10/(2-3);"));
  test.equal(5, Lua.evalText("10/(2-3); return 2+3"));
  test.done();
};

exports.testBooleansAndNil = function(test) {
  // Default return value needs to be nil
  test.equal(null, Lua.evalText("1 + 2"));
  test.equal(null, Lua.evalText("return nil"));
  test.equal(true, Lua.evalText("return true"));
  test.equal(false, Lua.evalText("return false"));
  test.done();
}

exports.testAnonymousFunctions = function(test) {
  var fun;

  // Very simple
  fun = Lua.evalText("return function ()\nreturn 1\nend");
  test.equal(1, fun());

  // Default return value must be nil
  fun = Lua.evalText("return function ()\n 1\nend");
  test.equal(null, fun());

  test.done();
}