var Lua = require("lib/lua.js");

exports.testArithmeticExpressions = function(test){
  test.equal(3, Lua.evalText("1+2"));
  test.done();
};