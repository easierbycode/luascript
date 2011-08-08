/* lexical grammar */
%lex
%%

";"\s*(\r?\n)+         return 'COLON'
";"                    return 'COLON'
(\r?\n)+               return 'NEWLINE'
","                    return 'COMMA'
\s+                    /* skip whitespace */

"if"                   return "IF"
"then"                 return "THEN"
"else"                 return "ELSE"
"elseif"               return "ELSEIF"
"for"                  return "FOR"
"in"                   return "IN"
"not"                  return "NOT"
"and"                  return "AND"
"or"                   return "OR"
"nil"                  return 'NIL'
"true"                 return 'TRUE'
"false"                return 'FALSE'
"function"             return 'FUNCTION'
"do"                   return 'DO'
"return"               return 'RETURN'
"end"                  return 'END'
"local"                return 'LOCAL'
"while"                return 'WHILE'
"repeat"               return 'REPEAT'
"until"                return 'UNTIL'
"break"                return 'BREAK'

[0-9]+("."[0-9]+)?\b   return 'NUMBER'
[a-zA-Z_][0-9a-zA-Z_]* return 'NAME'

"..."                  return '...'
"*"(\r?\n)*            return '*'
"/"(\r?\n)*            return '/'
"="(\r?\n)*            return '='
"-"(\r?\n)*            return '-'
"+"(\r?\n)*            return '+'
"("                    return '('
")"                    return ')'
<<EOF>>                return 'EOF'

/lex

/* operator associations and precedence */

%left or
%left and
%left '<' '>' '<=' '>=' '~=' '=='
%right '..'
%left '+' '-'
%left '*' '/' '%'
%right '^'

%start expressions

%% /* language grammar */

expressions
    : chunk EOF
        { return $1; }
    ;

chunk
    : statpart eol retpart
        { $1.push($2); $$ = $1.concat($3); }
    | statpart eol
        { $1.push($2); $$ = $1; }
    | statpart
        { $$ = $1; }
    | eol retpart
        { $2.unshift($1); $$ = $2; }
    | retpart
        { $$ = $1; }
    | eol
        { $$ = [$1]; }
    |
        { $$ = []; }
    ;

statpart
    : statpart eol stat
        { $1.push($2, $3); $$ = $1; }
    | eol stat
        { $$ = [$1, $2]; }
    | stat
        { $$ = [$1]; }
    ;

retpart
    : retstat eol
        { $$ = [$1, $2]; }
    | retstat
        { $$ = [$1]; }
    ;

block
    : chunk
        { $$ = $1; }
    ;

stat
    : assignment
        { $$ = $1; }
    | BREAK
        { $$ = ["BREAK"]; }
    | DO block END
        { $$ = ["DO", $2]; }
    | WHILE exp DO block END
        { $$ = ["WHILE", $2, $4]; }
    | REPEAT block UNTIL exp
        { $$ = ["REPEAT", $4, $2]; }
    | if
        { $$ = $1; }
    | FUNCTION funcname funcbody
        { $$ = ["ASSIGN", [$2], [["FUNCTION", $3[0], $3[1]]]]; }
    | LOCAL FUNCTION NAME funcbody
        { $$ = ["BLOCK", [
            ["ASSIGN", [["LOCALVAR", $3]], []],
            ["COLON"],
            ["ASSIGN", [["VAR", $3]], [["FUNCTION", $4[0], $4[1]]]]
          ]];
        }
    | LOCAL namelist
        { $$ = ["LOCAL_ASSIGN", $2, []]; }
    | LOCAL namelist '=' explist
        { $$ = ["LOCAL_ASSIGN", $2, $4]; }
    ;

if
    : IF exp THEN block END
        { $$ = ["IF", $2, $4, [], []]; }
    | IF exp THEN block else END
        { $$ = ["IF", $2, $4, [], $5]; }
    | IF exp THEN block elseifs END
        { $$ = ["IF", $2, $4, $5, []]; }
    | IF exp THEN block elseifs else END
        { $$ = ["IF", $2, $4, $5, $6]; }
    ;

elseifs
    : elseifs elseif
        { $1.push($2); $$ = $1; }
    | elseif
        { $$ = [$1]; }
    ;

elseif
    : ELSEIF exp THEN block
        { $$ = ["ELSEIF", $2, $4]; }
    ;

else
    : ELSE block
        { $$ = $2; }
    ;

retstat
    : RETURN exp
        /* This should be an explist but it can't be supported by JS */
        { $$ = ["RETURN", $2]; }
    | RETURN
        { $$ = ["RETURN", ["NIL"]]; }
    ;

assignment
    : var '=' exp
        /* Force = to avoid conflicts with prefixexp */
        { $$ = ["ASSIGN", [$1], [$3]]; }
    | var comma varlist '=' explist
        { $3.unshift($1); $$ = ["ASSIGN", $3, $5]; }
    ;

funcname
    : NAME
        { $$ = ["VAR", $1]; }
    ;

varlist
    : varlist comma var
        { $1.push($3); $$ = $3; }
    | var
        { $$ = [$1]; }
    ;

var
    : NAME
        { $$ = ["VAR", $1]; }
    ;

namelist
    : namelist comma NAME
        { $1.push(["VAR", $3]); $$ = $1; }
    | NAME
        { $$ = [["VAR", $1]]; }
    ;

explist
    : explist comma exp
        { $1.push($3); $$ = $1 }
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
    | '...'
        { $$ = ["TDOT"]; }
    | function
        { $$ = $1; }
    | prefixexp
        { $$ = $1; }
    | exp '*' exp
        { $$ = ["BINOP", $2, $1, $3]; }
    | exp '/' exp
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
    : namelist comma '...'
        { $1.push(["TDOT"]); $$ = $1; }
    | namelist
        { $$ = $1; }
    | '...'
        { $$ = [["TDOT"]]; }
    | /* empty */
        { $$ = []; }
    ;

eol
    : COLON
        { $$ = ["COLON"]; }
    | NEWLINE
        { $$ = ["NEWLINE"]; }
    ;

comma
    : COMMA
        { $$ = $1; }
    | COMMA NEWLINE
        { $$ = $1; }
    ;