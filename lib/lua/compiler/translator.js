var VarsScope = function() {
  this.readVars = [];
  this.shadowedVars = {};
}

var ASTWalker = function () {
  this.argsTranslate = false;
  this.varScope = new VarsScope();
  this.varCounter = 0;
}

ASTWalker.prototype = {
  "translateNode": function(node) {
    return this[node[0]](node);
  },

  "translateAST": function(ast, separator) {
    var buffer = [];

    // Remove any initial new line
    var first = ast[0];
    if(first && (first[0] === 'NEWLINE' || first[0] === 'COLON')) {
      ast = ast.slice(1);
    };

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

  "createTempVar": function() {
    var temp = "__lvar" + (this.varCounter++);
    return temp;
  },

  "shadowVars": function(fun) {
    var current = this.varScope;
    this.varScope = new VarsScope();
    var result = fun(this);
    this.varScope = current;
    return result;
  },

  // Visitor pattern

  "REPEAT": function(current) {
    return this.shadowVars(function(translator){
      var exprs = translator.translateAST(current[2]);
      var condition = translator.translateNode(current[1]);
      var result = "do{\r\n" + exprs + "} while(__lua.isFalse(" + condition + "))";
      return "(function(){\r\n" + result + "})();";
    });
  },

  "WHILE": function(current) {
    return this.shadowVars(function(translator){
      var condition = translator.translateNode(current[1]);
      var exprs = translator.translateAST(current[2]);
      var result = "while(__lua.isTrue(" + condition + ")){\r\n" + exprs + "}";
      return "(function(){\r\n" + result + "})();";
    });
  },

  "BREAK": function(current) {
    return "break";
  },

  "LOCALVAR": function(current) {
    var original = current[1];
    var result   = original;
    var varScope = this.varScope;

    if(varScope.readVars.indexOf(original) !== -1) {
      var shadowed = varScope.shadowedVars;
      result = shadowed[original] || this.createTempVar();
      shadowed[original] = result
    }
    return "var " + result;
  },

  "VAR": function(current) {
    var original = current[1];
    var result   = original;
    var varScope = this.varScope;
    var shadowed = varScope.shadowedVars[original];

    if(shadowed) {
      result = shadowed;
    } else if(varScope.readVars.indexOf(original) === -1) {
      varScope.readVars.push(original);
    }

    return result;
  },

  "COLON": function(current) {
    return ";\r\n";
  },

  "NEWLINE": function(current) {
    return this.argsTranslate ? "\r\n" : ";\r\n";
  },

  "FUNCALL" : function(current) {
    var args = this.translateArgs(current[2]);
    var expr = this.translateNode(current[1]);
    return expr + "(" + args + ")";
  },

  "FUNCTION" : function(current) {
    return this.shadowVars(function(translator){
      var args = translator.translateArgs(current[1]);
      var body = current[2];
      var last = body[body.length - 1];
      var lastkey = last[0];

      // Add a return to force the function to return nil
      // instead of undefined. Also, wrap it properly in colons.
      if(!(last && lastkey == "RETURN")) {
        if(lastkey !== "NEWLINE" && lastkey !== "COLON") body.push(["COLON"]);
        body.push(["RETURN", ["NIL"]], ["COLON"]);
      };

      return "(function (" + args + ") {\r\n" + translator.translateAST(body) + "})";
    });
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
      var right = this.translateNode(exprs[0]);
      var left = this.translateNode(vars[0]);
      buffer.push(left + "=" + right);
    } else if(exprs.length != 0) {
      var temp_vars = [];
      var temp_buffer = [];

      // Assign each right value to a temp var
      for(i in exprs) {
        var temp_var = this.createTempVar();
        temp_vars.push(temp_var);
        temp_buffer.push(temp_var + "=" + this.translateNode(exprs[i]));
      }

      // Push temp vars to the buffer
      buffer.push("var " + temp_buffer.join(","));

      // Push all extra expressions
      for(i in extra) {
        buffer.push(this.translateNode(extra[i]));
      }

      // Finally assign everything
      for(i in vars) {
        buffer.push(this.translateNode(vars[i]) + "=" + temp_vars[i]);
      }
    }

    // Add null vars to the buffer
    for(i in null_vars) {
      buffer.push(this.translateNode(null_vars[i]) + "=" + "null");
    }

    return buffer.join(";\r\n")
  },

  "LOCAL_ASSIGN": function(current) {
    var vars = current[1];
    for(var i in vars) vars[i][0] = "LOCALVAR";
    return this["ASSIGN"](["ASSIGN", vars, current[2]]);
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

Lua.ASTWalker = ASTWalker;