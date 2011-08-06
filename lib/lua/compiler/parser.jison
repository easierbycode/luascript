/* lexical grammar */
%lex
%%

";"\s*"\r"?"\n"        return 'COLON'
";"                    return 'COLON'
("\r"?"\n")+           return 'NEWLINE'
","                    return 'COMMA'
\s+                    /* skip whitespace */

"nil"                  return 'NIL'
"true"                 return 'TRUE'
"false"                return 'FALSE'
"return"               return 'RETURN'
"function"             return 'FUNCTION'
"end"                  return 'END'

[0-9]+("."[0-9]+)?\b   return 'NUMBER'
[a-zA-Z_][0-9a-zA-Z_]* return 'NAME'
"*"                    return 'BINOP_MULT'
"/"                    return 'BINOP_MULT'
"="                    return '='
"-"                    return '-'
"+"                    return '+'
"("                    return '('
")"                    return ')'
<<EOF>>                return 'EOF'

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
    : chunkpart eol laststat eol
        { $1.push($2, $3, $4); $$ = $1; }
    | chunkpart eol laststat
        { $1.push($2, $3); $$ = $1; }
    | chunkpart eol
        { $1.push($2); $$ = $1; }
    | chunkpart
        { $$ = $1; }
    | laststat eol
        { $$ = [$1, $2]; }
    | laststat
        { $$ = [$1]; }
    | eol
        { $$ = []; }
    ;

chunkpart
    : chunkpart eol stat
        { $1.push($2, $3); $$ = $1; }
    | stat
        { $$ = [$1]; }
    ;

block
    : chunk
        { $$ = $1; }
    |
        { $$ = []; }
    ;

stat
    : varlist '=' explist
        { $$ = ["ASSIGN", $1, $3] }
    ;

laststat
    : RETURN exp
        /* This should be an explist but it can't be supported by JS */
        { $$ = ["RETURN", $2]; }
    | RETURN
        { $$ = ["RETURN", ["NIL"]]; }
    ;

varlist
    : var COMMA varlist
        { $3.unshift($1); $$ = $3; }
    | var
        { $$ = [$1]; }
    ;

var
    : NAME
        { $$ = ["VAR", $1]; }
    ;

namelist
    : NAME COMMA namelist
        { $3.unshift(["VAR", $1]); $$ = $3; }
    | NAME
        { $$ = [["VAR", $1]]; }
    ;

explist
    : exp COMMA explist
        { $3.unshift($1); $$ = $3 }
    | exp
        { $$ = [$1]; }
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
    : var
        { $$ = $1; }
    | functioncall
        { $$ = $1; }
    | '(' exp ')'
        { $$ = $2; }
    ;

functioncall
    : prefixexp args
        { $$ = ["FUNCALL", $1, $2]; }
    ;

args
    : '(' ')'
        { $$ = []; }
    | '(' explist ')'
        { $$ = $2; }
    ;

function
    : FUNCTION funcbody
        { $$ = ["FUNCTION", $2[0], $2[1]]; }
    ;

funcbody
    : '(' parlist ')' block END
        { $$ = [$2, $4]; }
    ;

parlist
    : namelist
        { $$ = $1; }
    |
        { $$ = []; }
    ;

eol
    : COLON
        { $$ = ["COLON"]; }
    | NEWLINE
        { $$ = ["NEWLINE"]; }
    ;