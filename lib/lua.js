var Lua = {};
var parser = require("./lua/compiler/parser.js").parser;
var translator = require("./lua/compiler/translator.js");

// Receives a text and returns the AST
Lua.parseText = function(input) {
  return parser.parse(input);
};

Lua.translateText = function(input) {
  var parsed = Lua.parseText(input);
  return translator.translateNode(parsed);
}

Lua.evalText = function(input) {
  return eval(Lua.translateText(input));
};

module.exports = Lua;