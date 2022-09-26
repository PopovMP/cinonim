'use strict'

const {strictEqual}  = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const {ciToWat}      = require('../../index')

const src = `
#export-func mc91 = mc91

int mc91rec(int n, int c)
{
	if (c != 0) {
		if (n > 100)
			return mc91rec(n - 10, c - 1);

		return mc91rec(n + 11, c + 1);
	}

	return n;
}

int mc91(int n)
{
	return mc91rec(n, 1);
}
`

const expected = `
(module
    (export "mc91" (func $mc91))
    (func $mc91rec (param $n i32) (param $c i32) (result i32)
        (local.get $c) (i32.const 0) (i32.ne)
        (if (then
            (local.get $n) (i32.const 100) (i32.gt_s)
            (if (then
                (local.get $n) (i32.const 10) (i32.sub)
                (local.get $c) (i32.const 1) (i32.sub)
                (call $mc91rec)
                (return)
            ))
            (local.get $n) (i32.const 11) (i32.add)
            (local.get $c) (i32.const 1) (i32.add)
            (call $mc91rec)
            (return)
        ))
        (local.get $n)
    )
    (func $mc91 (param $n i32) (result i32)
        (local.get $n)
        (i32.const 1)
        (call $mc91rec)
    )
)
`

describe('McCarthy 91', () => {
	it('compiles McCarthy 91 to WAT', () => {
		const actual = '\n' + ciToWat(src) + '\n'
		strictEqual(actual, expected)
	})
})
