
/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"*"                   return 'BINOP_MULT'
"/"                   return 'BINOP_MULT'
"-"                   return 'BINOP_ADD'
"+"                   return 'BINOP_ADD'
"("                   return '('
")"                   return ')'
<<EOF>>               return 'EOF'

/lex

/* operator associations and precedence */

%left BINOP_ADD
%left BINOP_MULT

%start expressions

%% /* language grammar */

expressions
    : exp EOF
        { return $1; }
    ;

exp
    : NUMBER
        { $$ = ["NUMBER", $1]; }
    | prefixexp
        { $$ = $1; }
    | exp BINOP_MULT exp
        { $$ = ["BINOP", $2, $1, $3]; }
    | exp BINOP_ADD exp
        { $$ = ["BINOP", $2, $1, $3]; }
    ;

prefixexp
    : '(' exp ')'
        { $$ = $2; }
    ;