'use strict'

const {strictEqual}  = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const {ciToWat}      = require('../../index')

const src =
`void foo()
{
	int a, b, c;

	a = 1, b = 2;

	if (a > 2) {
		a = 2;
	}

	if (a == 3 && b == 4) {
		a = b;
		b = 5;
	}
	else
	{
		a = 2;
	}
}
`

const expected =`
(module
    (func $foo
        (local $a i32)
        (local $b i32)
        (local $c i32)
        (local.set $a (i32.const 1))
        (local.set $b (i32.const 2))
        (local.get $a) (i32.const 2) (i32.gt_s)
        (if (then
            (local.set $a (i32.const 2))
        ))
        (local.get $a) (i32.const 3) (i32.eq) (local.get $b) (i32.const 4) (i32.eq) (i32.and)
        (if (then
            (local.set $a (local.get $b))
            (local.set $b (i32.const 5))
        )(else
            (local.set $a (i32.const 2))
        ))
    )
)
`

describe('if-else', () => {
	it('compiles if-else to WAT', () => {
		const actual = '\n' + ciToWat(src) + '\n'
		strictEqual(actual, expected)
	})
})
