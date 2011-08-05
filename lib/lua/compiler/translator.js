function translateNode(node) {
  return ASTWalker[node[0]](node);
}

function translateAST(ast) {
  var buffer = "";
  for(var node in ast) {
    buffer += translateNode(ast[node]);
  };
  return buffer;
}

var ASTWalker = {
  "EOL": function(current) {
    return ";\r\n";
  },
  "NIL": function(current) {
    return "null";
  },
  "FALSE": function(current) {
    return "false";
  },
  "TRUE": function(current) {
    return "true";
  },
  "BINOP": function(current) {
    var left  = translateNode(current[2]);
    var right = translateNode(current[3]);
    return "(" + left + current[1] + right + ")";
  },
  "UNOP": function(current) {
    var expr  = translateNode(current[2]);
    return "(" + current[1] + expr + ")";
  },
  "NUMBER": function(current) {
    return current[1]
  }
}

module.exports = {
  "translateAST": translateAST,
  "translateNode": translateNode
}