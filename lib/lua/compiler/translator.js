function ASTWalker() {
  this.argsTranslate = false;
}

ASTWalker.prototype = {
  "translateNode": function(node) {
    return this[node[0]](node);
  },

  "translateAST": function(ast, separator) {
    var buffer = [];
    for(var node in ast) {
      buffer.push(this.translateNode(ast[node]));
    };
    return buffer.join(separator || "");
  },

  "translateArgs": function(args) {
    var current = this.argsTranslate;
    this.argsTranslate = true;
    var result = this.translateAST(args, ",");
    this.argsTranslate = current;
    return result;
  },

  "VAR": function(current) {
    return current[1];
  },

  "COLON": function(current) {
    return ";\r\n";
  },

  "NEWLINE": function(current) {
    return this.argsTranslate ? ";\r\n" : "\r\n";
  },

  "FUNCALL" : function(current) {
    var args = this.translateArgs(current[2]);
    var expr = this.translateNode(current[1]);
    return expr + "(" + args + ")";
  },

  "FUNCTION" : function(current) {
    var args = this.translateArgs(current[1]);
    var body = current[2];
    var last = body[body.length - 1];
    if(!(last && last[0] == "RETURN")) {
      body.push(["COLON"], ["RETURN", ["NIL"]]);
    };
    return "(function (" + args + ") {\r\n" + this.translateAST(body) + "})";
  },

  "RETURN": function(current) {
    var content = "return " + this.translateNode(current[1]);
    return content;
  },

  "ASSIGN": function(current) {
    var vars  = current[1];

    // Slice all exprs and if more exprs than
    // variables are given, we store them in extra
    var exprs = current[2].slice(0, vars.length);
    var extra = current[2].slice(vars.length);

    // Sometimes we have more variables than expressions
    // so we need to fill them with nil
    var null_vars = vars.slice(exprs.length);
    vars = vars.slice(0, exprs.length);

    // Helpers
    var buffer = [], i = 0;

    // If we have just one var just assign it, optimizing most common case.
    if(vars.length == 1 && extra.length == 0) {
      buffer.push(this.translateNode(vars[0]) + "=" + this.translateNode(exprs[0]));
    } else {

    }

    // Add null vars to the buffer
    for(i in null_vars) {
      buffer.push(this.translateNode(null_vars[i]) + "=" + "null");
    }

    return buffer.join(";\r\n")
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