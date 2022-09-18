# Peperoni - C like language targeting WebAssembly

**Peperoni** aims to be directly transpiled to WebAssembly.

## Data types
  * **int**    -> **i32**
  * **long**   -> **i64**
  * **float**  -> **f32**
  * **double** -> **f64**
  * **void**   -> **void** used as a function return type

## Line comment

```c
// This is a line comment
```

## Global variable and constant definition

Global variables and constants must be initialised with a number.

```c
int    foo = 42;
long   bar = 66L;
float  faz = 2.1F;
double daz = 3.14;
``` 

## Function declaration

```c
int sum(const int m, const int n) { return m + n; }

void foo(double bar) { ... }
```

## Local variable declaration

Local variables are declared within a function at the beginning of the function body.

```c
void foo() {
    int    bar;
    double baz;
}
``` 

## Assignment

Local and global variable assignment

```c
double foo = 1.1;

void func(int bar) {
    int baz;

    foo = 3.14
    bar = 42;
}
```

## Conditionals

**if** accepts an `int` number or expression.

```c
int books;

if (books) {
 // statements
} else {
 // statements
}
```

## Loops

The loop's conditions is `i32`. 

```c
let i;

for (i = 0; i < max; i = i + 1) {
    break;
    continue;
}

do {
    break;
    continue;
} while (i < max);

while (foo) {
    break;
    continue;
}

```

## Grammar

```ebnf
module           = {global-variable | global-constant | function-def};
global-variable  = numeric-type, alphanum, "=", numeric, ";";
global-constant  = "const", numeric-type, alphanum, "=", numeric, ";";
function-def     = data-type, alphanum, "(", (parameter, {",", parameter})?, ")", "{", function-body, "}";
data-type        = "void" | numeric-type ;
numeric-type     = "int"  | "long" | "float" | "double" ;
alphanum         = [a-z A-Z]+ [a-z A-Z 0-9]* ;
numeric          = "-"? [0-9]+ ("." [0-9]+)? ;
parameter        = numeric-type, alphanum;
function-body    = local-variable*, statement* ;
local-variable   = numeric-type, alphanum, ";" ;
return           = "return", expression?, ";" ;
function-call    = alphanum, "(", (expression, (",", expression)* )?, ")" ;
if               = "if", "(", expression, ")", "{", statement*, "}", ("{", "else", statement* "}")? ;
for              = "for", "(", asignment?, ";", expression?, ";", asignment?, ")", "{", loop-body?, "}" ;
do               = "do", "{", loop-body?, "}",  "while", "(", expression, ")", ";" ;
while            = "while", "(", expression, ")", "{", loop-body?, "}" ;
loop-body        = {statement | break | continue} ;
break            = "break", numeric?, ";" ;
continue         = "continue", numeric?, ";" ;
statement        = assignment, ";" | do | while | if | function-call, ";" | statement ;
assignment       = alphanum, "=", expression ;
expression       = grouping | numeric | variable-lookup | function-call | unary-operation |
                   binary-operation | expression;
grouping         = "(", expression, ")" ;
variable-lookup  = alphanum	;
binary-operation = expression, binary-operator, expression;
unary-operation  = prefix-operator, (numeric | variable-lookup | function-call | grouping) ;
prefix-operator  = "-" | "!";
binary-operator  =  "+"  | "-" | "*" | "/" | "%" | "||" | "&&" | "==" | "" | "" | "=" | "=" | "!=" ;
keyword          = "break" | "continue" | "const"  | "do"   | "double" | "else" | "float" | "if" | "int" |
                   "long"  | "loop"     | "return" | "void" | "while";
```

## AST structure

```
module
    +-- [*] globalVar {val: varName, dataType: varDataType}
    |           \-- [1] number
    |
    +-- [*] globalConst {val: varName, dataType: varDataType}
    |           +-- [1] number
    |
    \-- [*] function {value: funcName, dataType: funcDataType}
                +-- [1] funcParams
                |           \-- [*] localVar | localConst
                |
                \-- [1] funcBody
                            +-- [*] localVar {val: varName, dataType: varDataType}
                            +-- [*] FORM 

FORM =
    | asignment
    | localSet
    | globalSet
    | do
    | while
    | break
    | continue
    | funcCall
    | if
    | return

globalSet {value: varName, dataType: varDataType}
    \-- [1] expression

localSet {value: varName, dataType: varDataType}
    \-- [1] expression

break    {value: ?index}

continue {value: ?index}

funcCall {value: funcName, dataType: funcDataType}
    \-- [*] expression

if
    +-- [1] condition: i32
    |           \-- [1] expression: i32
    +-- [1] then
    |           \-- [*] FORM
    \-- [?] else
                \-- [*] FORM

for
    +-- [1] statement
    |           \-- [*] localSet | globalSet
    +-- [1] condition: i32
    |           \-- [?] expression: i32
    +-- [1] statement
    |           \-- [*] asignment
    +-- [1] loopBody
                \-- [*] FORM

do
    +-- [1] loopBody
    |           \-- [*] FORM
    \-- [1] condition: i32
                \-- [1] expression: i32

while
    +-- [1] condition: i32
    |           \-- [1] expression: i32
    \-- [1] loopBody
                \-- [*] FORM

return {value: funcName, dataType: funcDataType}
    \-- [1] expression

expression
    | [1] number
    | [1] prefixOperator
    |           \-- [1] expression
    | [1] postfixOperator
    |           \-- [1] expression
    | [1] binaryOperator
    |           +-- [1] expression
    |           \-- [1] expression
    | [1] expression
    | [1] funcCall
    |           \-- [*] expression
    | [1] localGet
    | [1] globalGet
```
