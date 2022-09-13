# Peperoni - C like language targeting WAT

**Peperoni** aims to be directly transpiled to WAT.

## Data types
  * **int**    -> **i32**
  * **long**   -> **i64**
  * **float**  -> **f32**
  * **double** -> **f64**
  * **void**   -> used as a function return type

## Line comment

```c
// This is a line comment
```

## Global variable and constant definition

Global variables must be initialised with a number.

```c
int foo = 42;
``` 

```wat
(global $foo (mut i32) (i32.const 42))
```

Global constants must be initialised with a number.

```c
const double bar = 3.14;
``` 

```wat
(global $bar f64 (f64.const 3.14))
```

## Function declaration

```c
int sum(int a, int b) { }
```

```wat
(func $sum (param $a i32) (param $b i32) (result i32) )
```

## Local variable declaration

Local variables are declared within a function at the beginning of the function body.

```c
void foo() {
    int    bar;
    double baz;
}
``` 

```wat
(func $foo 
    (local $bar i32)
    (local $baz f64))
```

## Assignment

Local variable assignment

```c
void foo() {
    int bar;
    bar = 42;
}
```

```wat
(func $foo
    (local $bar i32)
    (local.set $bar (i32.const 42)))
```

Function parameter assignment

```c
void foo(float bar) {
    bar = 3.14;
}
```

```wat
(func $foo (param $bar f32)
    (local.set $bar (f32.const 3.14)))
```

Global variable assignment

```c
double bar = 0;
void foo() {
    bar = 3.14;
}
```

```wat
(global $bar f64 (f64.const 0))
(func $foo
    (global.set $bar (f64.const 3.14)))
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
                |           \-- [*] parameter
                |
                \-- [1] funcBody
                            +-- [*] localVar {val: varName, dataType: varDataType}
                            +-- [*] FORM 

FORM =
    | assignment
    | block
    | branch
    | branchIf
    | funcCall
    | if
    | loop
    | return

assignment {value: varName, dataType: varDataType}
    \-- [1] expression

block {value: ?label}
    \-- [*] FORM

branch {value: ?label|index}

branchIf {value: ?label|index}
    +-- [1] expression

funcCall {value: funcName, dataType: funcDataType}
    \-- [*] expression

if
    +-- [1] expression
    +-- [1] then
    |           \-- [*] FORM
    \-- [!] else
                \-- [*] FORM

loop {value: ?label}
    \-- [*] FORM

return {value: funcName, dataType: funcDataType}
    \-- [1] expression

expression
    +-- [!] number
    +-- [!] unaryOp
    |           \-- [1] expression
    +-- [!] binaryOp
    |           +-- [1] expression
    |           \-- [1] expression
    +-- [!] expression
    +-- [!] funcCall
    |           \-- [*] expression
    \-- [!] varLookup
```
