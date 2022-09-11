# Peperoni - C like language targeting WAT

**Peperoni** aims to be directly transpiled to WAT.

## Data types
  * **int** -> **i32**
  * **long** -> **i64**
  * **float** -> **f32**
  * **double** -> **f64**
  * **char** -> **u8**
  * **void** -> used as a function return type

## Line comment

```c
// This is a line comment
```

## Globals

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
