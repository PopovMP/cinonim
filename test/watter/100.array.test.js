'use strict'

/*
	Allocates arrays. Sets and gets values. Prints 42.

const wasmInstance = new WebAssembly.Instance(wasmModule, {})
const { get13 } = wasmInstance.exports
console.log( get13() )

 */

const {strictEqual}  = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const {ciToWat}      = require('../../index')

const src = `
#export-func get13 = get13

double foo[100]; // ptr:    0, size: 8*100
float  bar[100]; // ptr:  800, size: 4*100
int    baz[100]; // ptr: 1200, size: 4*100
long   gaz[100]; // ptr: 1600, size: 8*100

int get13()
{
	int i, n;
	
	i = 13;
	n = 42;

	foo[i] = (double) n; //    0 + i<<3
	bar[i] = (float)  n; //  800 + i<<2
	baz[i] =          n; // 1200 + i<<2
	gaz[i] = (long)   n; // 1600 + i<<3

	return baz[13];
}
`

const expected = `
(module
    (export "get13" (func $get13))
    (memory 1)
    (func $get13 (result i32)
        (local $i i32)
        (local $n i32)
        (local.set $i (i32.const 13))
        (local.set $n (i32.const 42))
        (f64.store (i32.add (i32.const 0) (i32.shl (local.get $i) (i32.const 3))) (local.get $n) (f64.convert_i32_s))
        (f32.store (i32.add (i32.const 800) (i32.shl (local.get $i) (i32.const 2))) (local.get $n) (f32.convert_i32_s))
        (i32.store (i32.add (i32.const 1200) (i32.shl (local.get $i) (i32.const 2))) (local.get $n))
        (i64.store (i32.add (i32.const 1600) (i32.shl (local.get $i) (i32.const 3))) (local.get $n) (i64.extend_i32_s))
        (i32.load (i32.add (i32.const 1200) (i32.shl (i32.const 13) (i32.const 2))))
    )
)
`

describe('array', () => {
	it('compiles array allocation', () => {
		const actual = '\n' + ciToWat(src) + '\n'
		strictEqual(actual, expected)
	})
})
