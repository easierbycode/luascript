function translateNode(node) {
  return ASTWalker[node[0]](node);
}

function translateAST(ast) {
  var buffer = "";
  for(var node in ast) {
    buffer += translateNode(node);
  }
  return buffer;
}

var ASTWalker = {
  "BINOP": function(current) {
    left  = translateNode(current[2]);
    right = translateNode(current[3]);
    return "(" + left + current[1] + right + ")";
  },
  "NUMBER": function(current) {
    return current[1]
  }
}

module.exports = {
  "translateAST": translateAST,
  "translateNode": translateNode
}