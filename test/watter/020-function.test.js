'use strict'

const {strictEqual}  = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const {ciToWat}      = require('../../index')

const src = `
#export-func sub = callSub

int sub(const int a, const int b)
{
	return a - b;
}

void foo(double a, long b) {}

int callSub(int a, int b) {
	foo(1, 2);

	return sub(a, b);
}
`

const expected = `
(module
    (export "sub" (func $callSub))
    (func $sub (param $a i32) (param $b i32) (result i32)
        (local.get $a) (local.get $b) (i32.sub)
    )
    (func $foo (param $a f64) (param $b i64)
    )
    (func $callSub (param $a i32) (param $b i32) (result i32)
        (f64.const 1)
        (i64.const 2)
        (call $foo)
        (local.get $a)
        (local.get $b)
        (call $sub)
    )
)
`

describe('function', () => {
	it('compiles function to WAT', () => {
		const actual = '\n' + ciToWat(src) + '\n'
		strictEqual(actual, expected)
	})
})
