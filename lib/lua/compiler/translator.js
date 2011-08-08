var VarsScope = function() {
  this.readVars = [];
  this.shadowedVars = {};
}

var LoopScope = function() {
  this.returned = false;
}

var ASTWalker = function () {
  this.argsTranslate = false;
  this.functionSpread = null;
  this.loopScope = null;
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
    var old = this.argsTranslate;
    this.argsTranslate = true;
    var result = this.translateAST(args, ",");
    this.argsTranslate = old;
    return result;
  },

  // This needs to keep two important semantics from Lua:
  //   * Variables created inside the loop cannot leak to the outer scope
  //   * return inside the loop needs to halt the outer function
  // TODO: This could probably be rewritten using let
  "translateBlock": function(fun) {
    return this.shadowVars(function(translator) {
      var old = translator.loopScope;
      translator.loopScope = new LoopScope();

      // Call the function and wrap the result in a function
      var result = "(function(){\r\n" + fun(translator) + "})();\r\n";

      // If return was translated at some point,
      // we need to return from the wrapper function as well.
      if(translator.loopScope.returned) {
        var temp = translator.createTempVar();
        result  = "var " + temp + "=" + result;
        result += "if(" + temp + " instanceof __lua.returnWrapper) return " + temp + "[\"value\"];"
      }

      translator.loopScope = old;
      return result;
    });
  },

  "createTempVar": function() {
    var temp = "__lvar" + (this.varCounter++);
    return temp;
  },

  "shadowVars": function(fun) {
    var old = this.varScope;
    this.varScope = new VarsScope();
    var result = fun(this);
    this.varScope = old;
    return result;
  },

  "ifClause": function(current) {
    var condition = this.translateNode(current[1]);
    var exprs = this.translateAST(current[2]);
    return "if(__lua.isTrue(" + condition + ")){\r\n" + exprs + "}";
  },

  "lastIndexOfTDOT": function(args) {
    var index = -1;
    for(var i in args) {
      if(args[i][0] == "TDOT") index = i;
    }
    return index;
  },

  "badTDOT": function() {
    throw("cannot use '...' outside a vararg function");
  },

  // Visitor pattern

  "REPEAT": function(current) {
    return this.translateBlock(function(translator){
      var exprs = translator.translateAST(current[2]);
      var condition = translator.translateNode(current[1]);
      return "do{\r\n" + exprs + "} while(__lua.isFalse(" + condition + "))";
    });
  },

  "WHILE": function(current) {
    return this.translateBlock(function(translator){
      var condition = translator.translateNode(current[1]);
      var exprs = translator.translateAST(current[2]);
      return "while(__lua.isTrue(" + condition + ")){\r\n" + exprs + "}";
    });
  },

  "DO": function(current) {
    return this.translateBlock(function(translator){
      return translator.translateAST(current[1]);
    });
  },

  "IF": function(current) {
    return this.translateBlock(function(translator){
      var result = translator.ifClause(current);
      var elsifs = current[3];
      var else_  = current[4];

      for(var i in elsifs) {
        result += " else " + translator.ifClause(elsifs[i]);
      }

      if(else_.length) {
        result += " else {\r\n" + translator.translateAST(else_) + "}";
      }

      return result;
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
    var expr   = this.translateNode(current[1]);
    var args   = current[2];
    var index  = this.lastIndexOfTDOT(current[2]);
    var spread = this.functionSpread;

    if(index === -1) {
      return expr + "(" + this.translateArgs(args) + ")";
    } else if(spread !== null) {
      var before = [];
      var after  = [];

      for(var i in args) {
        if(i < index) before.push(args[i]);
        if(i > index) after.push(args[i]);
      };

      before = this.translateArgs(before);
      after  = this.translateArgs(after);

      var spreadArgs = "arguments," + spread + ",[" + before + "],[" + after + "]";
      return expr + ".apply(this, __lua.spread(" + spreadArgs + "))";
    } else {
      this.badTDOT();
    }
  },

  "FUNCTION" : function(current) {
    return this.shadowVars(function(translator){
      var last, lastkey, index = null;

      // Check if TDOT is given, if so, remove from the args list
      var bareArgs = current[1];
      last = bareArgs[bareArgs.length - 1];
      lastkey = last ? last[0] : null;
      if(lastkey === "TDOT") {
        bareArgs.pop();
        index = bareArgs.length;
      }

      // Assign function spread indexes
      var old = translator.functionSpread;
      translator.functionSpread = index;

      // Remaining setup
      var args = translator.translateArgs(bareArgs);
      var body = current[2];
      last = body[body.length - 1];
      lastkey = last ? last[0] : null;

      // Add a return to force the function to return nil
      // instead of undefined. Also, wrap it properly in colons.
      if(lastkey !== "RETURN") {
        if(lastkey !== "NEWLINE" && lastkey !== "COLON") body.push(["COLON"]);
        body.push(["RETURN", ["NIL"]], ["COLON"]);
      };

      // Translate body and restore original values
      var body = translator.translateAST(body);
      translator.functionSpread = old;

      return "(function (" + args + ") {\r\n" + body + "})";
    });
  },

  "TDOT": function(current) {
    var spread = this.functionSpread;
    if(spread !== null) {
      return "arguments[" + spread + "]";
    } else {
      this.badTDOT();
    };
  },

  "RETURN": function(current) {
    var content = this.translateNode(current[1]);
    if(this.loopScope) {
      this.loopScope.returned = true;
      content = "(new __lua.returnWrapper(" + content + "))";
    }
    return "return " + content;
  },

  "BLOCK": function(current) {
    return this.translateAST(current[1]);
  },

  "ASSIGN": function(current) {
    var vars = current[1];

    // Slice all exprs and if more exprs than
    // variables are given, we store them in extra
    var exprs = current[2].slice(0, vars.length);
    var extra = current[2].slice(vars.length);

    // Helpers
    var buffer = [], i = 0;

    // If we have just one var just assign it, optimizing most common case.
    if(vars.length === 1 && extra.length === 0) {
      var right = this.translateNode(exprs[0] || ["NIL"]);
      var left = this.translateNode(vars[0]);
      buffer.push(left + "=" + right);
    } else {
      var tempVars = [];
      var tempBuffer = [];

      // Check if we have a TDOT in the exprs.
      var index = this.lastIndexOfTDOT(exprs);
      if(index !== -1) {
        var spread = this.functionSpread;
        var expandSpread = (vars.length - exprs.length - extra.length + 1);
        // If the TDOT is invalid or we don't need to spread it,
        // we set the index back to -1 ensuring it won't match.
        if(spread === null || expandSpread <= 0) index = -1;
      }

      // Assign each right value to a temp var
      for(i in exprs) {
        if(i === index) {
          for(var j = 0; j < expandSpread; j++) {
            tempVars.push("arguments[" + (spread + j) +  "]");
          }
        } else {
          var tempVar = this.createTempVar();
          tempVars.push(tempVar);
          tempBuffer.push(tempVar + "=" + this.translateNode(exprs[i]));
        }
      }

      // Push assigned temp vars to the buffer
      if(tempBuffer.length) buffer.push("var " + tempBuffer.join(","));

      // Push all extra expressions
      for(i in extra) {
        buffer.push(this.translateNode(extra[i]));
      }

      // Finally assign everything
      for(i in vars) {
        buffer.push(this.translateNode(vars[i]) + "=" + (tempVars[i] || "null"));
      }
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