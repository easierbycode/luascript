function ASTWalker() {
}

ASTWalker.prototype = {
  "translateNode": function(node) {
    return this[node[0]](node);
  },

  "translateAST": function (ast, separator) {
    var buffer = [];
    for(var node in ast) {
      buffer.push(this.translateNode(ast[node]));
    };
    return buffer.join(separator || "");
  },

  "RETURN": function(current) {
    var content = "return " + this.translateNode(current[1]);
    return content;
  },

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
    var left  = this.translateNode(current[2]);
    var right = this.translateNode(current[3]);
    return "(" + left + current[1] + right + ")";
  },

  "UNOP": function(current) {
    var expr  = this.translateNode(current[2]);
    return "(" + current[1] + expr + ")";
  },

  "NUMBER": function(current) {
    return current[1]
  }
}

module.exports = {
  "ASTWalker": ASTWalker
}