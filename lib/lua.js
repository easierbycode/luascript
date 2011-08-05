var Lua = {};
var parser = require("./lua/compiler/parser.js").parser;
var ASTWalker = require("./lua/compiler/translator.js").ASTWalker;

// Receives a text and returns the AST
Lua.parseText = function(input) {
  return parser.parse(input);
};

Lua.translateText = function(input) {
  var parsed = Lua.parseText(input);
  var content = (new ASTWalker).translateAST(parsed);
  return "var _tmp = (function(){\r\n" + content + "\r\n})();\r\n_tmp === undefined ? null : _tmp"
}

Lua.evalText = function(input) {
  return eval(Lua.translateText(input));
};

module.exports = Lua;