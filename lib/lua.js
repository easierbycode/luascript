var Lua = {};
global.Lua = Lua;

var parser = require("./lua/compiler/parser.js").parser;
Lua.parser = parser;

require("./lua/compiler/translator.js");
var ASTWalker = Lua.ASTWalker;

// ENTRY FUNCTIONS

// Receives a text and returns the AST
Lua.parseText = function(input) {
  return parser.parse(input);
};

Lua.translateText = function(input) {
  // Parse text and return pure AST
  var parsed = Lua.parseText(input);
  // Wrap whatever was parsed in an anonymous function AST and call it
  var full = [
    ["ASSIGN", [["LOCALVAR", "_G"]], [["VAR", "this"]]],
    ["COLON"],
    ["ASSIGN", [["LOCALVAR", "__lua"]], [["VAR", "Lua"]]],
    ["COLON"],
    ["FUNCALL", ["FUNCTION", [], parsed], []]
  ];
  // Finally translate the AST and return its contents
  return (new ASTWalker).translateAST(full);
}

Lua.evalText = function(input) {
  return eval(Lua.translateText(input));
};

// CALLBACK FUNCTIONS

Lua.isTrue = function(expr) {
  return expr !== false && expr != null;
}

Lua.isFalse = function(expr) {
  return expr === false && expr == null;
}