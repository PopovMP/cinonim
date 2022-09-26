'use strict'

const {strictEqual}  = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const {ciToWat}      = require('../../index')

const src = `
double foo = 3.14;
long   bar = 42;
const float baz = 1.2F;

double fun(int a)
{
	bar = (long) a;
	foo = (double) baz;
	foo = ((double) baz) + 2 * ((double) a);
	foo = ((double) bar) + 1.2;
	return (double) baz;
}
`

const expected = `
(module
    (global $foo (mut f64) (f64.const 3.14))
    (global $bar (mut i64) (i64.const 42))
    (global $baz f32 (f32.const 1.2))
    (func $fun (param $a i32) (result f64)
        (global.set $bar (local.get $a) (i64.extend_i32_s))
        (global.set $foo (global.get $baz) (f64.promote_f32))
        (global.set $foo (global.get $baz) (f64.promote_f32) (f64.const 2) (local.get $a) (f64.convert_i32_s) (f64.mul) (f64.add))
        (global.set $foo (global.get $bar) (f64.convert_i64_s) (f64.const 1.2) (f64.add))
        (global.get $baz) (f64.promote_f32)
    )
)
`

describe('variables', () => {
	it('compiles variables to WAT', () => {
		const actual = '\n' + ciToWat(src) + '\n'
		strictEqual(actual, expected)
	})
})
