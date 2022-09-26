'use strict'

const {strictEqual}  = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const {ciToWat}      = require('../../index')

const src = `
void forLoop(int j)
{
	int i;
	for (i = 0, j = 0; i < 10; i += 1) { j = j + 1; }
	for (i = 0; i > 0; ) { }
	for (i = 0;; i = i + 1) { break; }
	for (i = 0, j = 1; ; i += 1, j -= 1) { break; }
	for (;;) { break; }
	
	for (;;) {
		if (i < 0) {
			break;
		}
		if (i >= 0) {
			break;
		}
	}
}

int doLoop(int i)
{
	do {
		i += 1;

		if (i == 5) {
			return i;
		}	
	} while (i < 10);
	
	return i;
}

int whileLoop(int i)
{
	while (i < 10) {
		if (i == 5) {
			return i;
		}
		else {
			break;
		}
	}

	return i;
}
`

const expected = `
(module
    (func $forLoop (param $j i32)
        (local $i i32)
        (local.set $i (i32.const 0))
        (local.set $j (i32.const 0))
        (block (loop
            (br_if 1 (i32.eqz (local.get $i) (i32.const 10) (i32.lt_s)))
            (local.set $j (local.get $j) (i32.const 1) (i32.add))
            (local.set $i (local.get $i) (i32.const 1) (i32.add))
            (br 0)
        ))
        (local.set $i (i32.const 0))
        (block (loop
            (br_if 1 (i32.eqz (local.get $i) (i32.const 0) (i32.gt_s)))
            (br 0)
        ))
        (local.set $i (i32.const 0))
        (block (loop
            (br 1)
            (local.set $i (local.get $i) (i32.const 1) (i32.add))
            (br 0)
        ))
        (local.set $i (i32.const 0))
        (local.set $j (i32.const 1))
        (block (loop
            (br 1)
            (local.set $i (local.get $i) (i32.const 1) (i32.add))
            (local.set $j (local.get $j) (i32.const 1) (i32.sub))
            (br 0)
        ))
        (block (loop
            (br 1)
            (br 0)
        ))
        (block (loop
            (local.get $i) (i32.const 0) (i32.lt_s)
            (if (then
                (br 1)
            ))
            (local.get $i) (i32.const 0) (i32.ge_s)
            (if (then
                (br 1)
            ))
            (br 0)
        ))
    )
    (func $doLoop (param $i i32) (result i32)
        (block (loop
            (local.set $i (local.get $i) (i32.const 1) (i32.add))
            (local.get $i) (i32.const 5) (i32.eq)
            (if (then
                (local.get $i)
                (return)
            ))
            (br_if 0 (local.get $i) (i32.const 10) (i32.lt_s))
        ))
        (local.get $i)
    )
    (func $whileLoop (param $i i32) (result i32)
        (block (loop
            (br_if 1 (i32.eqz (local.get $i) (i32.const 10) (i32.lt_s)))
            (local.get $i) (i32.const 5) (i32.eq)
            (if (then
                (local.get $i)
                (return)
            ))
            (br 1)
            (br 0)
        ))
        (local.get $i)
    )
)
`

describe('loops', () => {
	it('compiles loops to WAT', () => {
		const actual = '\n' + ciToWat(src) + '\n'
		strictEqual(actual, expected)
	})
})
