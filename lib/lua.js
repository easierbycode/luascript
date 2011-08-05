var Lua = {};
var parser = require("./lua/compiler/parser.js").parser;
var ASTWalker = require("./lua/compiler/translator.js").ASTWalker;

// Receives a text and returns the AST
Lua.parseText = function(input) {
  return parser.parse(input);
};

Lua.translateText = function(input) {
  // Parse text and return pure AST
  var parsed = Lua.parseText(input);
  // Wrap whatever was parsed in an anonymous function AST
  var full = [["FUNCTION", [], parsed]];
  // Finally translate the AST
  var content = (new ASTWalker).translateAST(full);
  // And return final contents
  return content + "();"
}

Lua.evalText = function(input) {
  return eval(Lua.translateText(input));
};

module.exports = Lua;