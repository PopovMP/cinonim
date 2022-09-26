'use strict'

const {strictEqual}  = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const {ciToWat}      = require('../../index')

const src = `
#export-func factorial = factorial

long factorial(int n)
{
	if (n == 0)	return 1;
	return ((long) n) * factorial(n - 1);
}
`

const expected = `
(module
    (export "factorial" (func $factorial))
    (func $factorial (param $n i32) (result i64)
        (local.get $n) (i32.const 0) (i32.eq)
        (if (then
            (i64.const 1)
            (return)
        ))
        (local.get $n) (i64.extend_i32_s) (local.get $n) (i32.const 1) (i32.sub)
        (call $factorial) (i64.mul)
    )
)
`

describe('factorial', () => {
	it('compiles factorial to WAT', () => {
		const actual = '\n' + ciToWat(src) + '\n'
		strictEqual(actual, expected)
	})
})
