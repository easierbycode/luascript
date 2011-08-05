
/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

";"\s*"\r"?"\n"       return 'BREAK'
"\r"?"\n"             return 'BREAK'
"\n"                  return 'BREAK'
";"                   return 'BREAK'

\s+                   /* skip whitespace */

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
    : explist EOF
        { return $1; }
    | EOF
        { return []; }
    ;

explist
    : explist BREAK exp
        { $1.push(["BREAK"], $3); }
    | exp
        { $$ = [$1]; }
    ;

exp
    : NUMBER
        { $$ = ["NUMBER", $1]; }
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