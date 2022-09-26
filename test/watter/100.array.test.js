'use strict'

const {strictEqual}  = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const {ciToWat}      = require('../../index')

const src = `
#export-func sum100 = sum100

int numbers[100];

int sum100()
{
	int i, sum;

	for (i=1; i<=100; i+=1)
		numbers[i] = i;

	sum=0;
	for (i=1; i<=100; i+=1)
		sum += numbers[i];

	return sum;
}
`

const expected = `
(module
    (memory 1)
    (export "sum100" (func $sum100))
    (func $sum100 (result i32)
        (local $i i32)
        (local $sum i32)
        (local.set $i (i32.const 1))
        (block
        (loop
            (br_if 1 (i32.eqz (local.get $i) (i32.const 100) (i32.le_s)))
            (i32.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2))) (local.get $i))
            (local.set $i (local.get $i) (i32.const 1) (i32.add))
            (br 0)
        ))
        (local.set $sum (i32.const 0))
        (local.set $i (i32.const 1))
        (block
        (loop
            (br_if 1 (i32.eqz (local.get $i) (i32.const 100) (i32.le_s)))
            (local.set $sum (local.get $sum) (i32.load (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 2)))) (i32.add))
            (local.set $i (local.get $i) (i32.const 1) (i32.add))
            (br 0)
        ))
        (local.get $sum)
    )
)
`

describe('array', () => {
	it('compiles array allocation', () => {
		const actual = '\n' + ciToWat(src) + '\n'
		strictEqual(actual, expected)
	})
})
