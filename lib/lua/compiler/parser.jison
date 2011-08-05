
/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

";"\s*"\r"?"\n"       return 'EOL'
"\r"?"\n"             return 'EOL'
"\n"                  return 'EOL'
";"                   return 'EOL'
","                   return 'COMMA'
\s+                   /* skip whitespace */

"nil"                 return 'NIL'
"true"                return 'TRUE'
"false"               return 'FALSE'
"return"              return 'RETURN'
"function"            return 'FUNCTION'
"end"                 return 'END'

[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"*"                   return 'BINOP_MULT'
"/"                   return 'BINOP_MULT'
"-"                   return '-'
"+"                   return '+'
"("                   return '('
")"                   return ')'
<<EOF>>               return 'EOF'

/lex

/* operator associations and precedence */

%left '+' '-'
%left BINOP_MULT

%start expressions

%% /* language grammar */

expressions
    : chunk EOF
        { return $1; }
    | EOF
        { return []; }
    ;

chunk
    : chunkpart EOL laststat EOL
        { $1.push(["EOL"], $3, ["EOL"]); }
    | chunkpart EOL laststat
        { $1.push(["EOL"], $3); }
    | chunkpart EOL
        { $1.push(["EOL"]); }
    | chunkpart
        { $$ = $1; }
    | laststat EOL
        { $$ = [$1, ["EOL"]]; }
    | laststat
        { $$ = [$1]; }
    | EOL
        { $$ = []; }
    ;

block
    : chunk
        { $$ = $1; }
    |
        { $$ = []; }
    ;

chunkpart
    : chunkpart EOL exp
        { $1.push(["EOL"], $3); }
    | exp
        { $$ = [$1]; }
    ;

stat
    : exp
        { $$ = $1; }
    ;

laststat
    : RETURN exp
        { $$ = ["RETURN", $2]; }
    | RETURN
        { $$ = ["RETURN", ["NIL"]]; }
    ;

exp
    : NIL
        { $$ = ["NIL"]; }
    | FALSE
        { $$ = ["FALSE"]; }
    | TRUE
        { $$ = ["TRUE"]; }
    | NUMBER
        { $$ = ["NUMBER", $1]; }
    | function
        { $$ = $1; }
    | prefixexp
        { $$ = $1; }
    | exp BINOP_MULT exp
        { $$ = ["BINOP", $2, $1, $3]; }
    | exp '+' exp
        { $$ = ["BINOP", $2, $1, $3]; }
    | exp '-' exp
        { $$ = ["BINOP", $2, $1, $3]; }
    | '-' exp
        { $$ = ["UNOP", $1, $2]; }
    ;

prefixexp
    : '(' exp ')'
        { $$ = $2; }
    ;

function
    : FUNCTION funcbody
        { $$ = ["FUNCTION", $2[0], $2[1]]; }
    ;

funcbody
    : '(' ')' block END
        { $$ = [[], $3]; }
    ;