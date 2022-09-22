'use strict'

const {strictEqual}         = require('assert')
const {tokenize, clean}     = require('@popovmp/tokenizer')
const {describe, it}        = require('@popovmp/mocha-tiny')
const {parse, stringifyAst} = require('../index.js')

const src = `
	float  fg = 1.2F;
	double dg = 1.2;
	int    ig = 42;
	long   lg = 42L;

	void foo() {
		int    a;
		double b;
		
		a = 42;
		a = ig;
		b = fg;
		b = dg;
		b = ig;
		a = (int) fg;
		a = (int) lg;
	}
`

const expected = `
module module
    globalVar fg: f32
        number 1.2: f32
    globalVar dg: f64
        number 1.2: f64
    globalVar ig: i32
        number 42: i32
    globalVar lg: i64
        number 42: i64
    function foo: void
        funcParams foo
        funcBody foo: void
            localVar a: i32
            localVar b: f64
            localSet a: i32
                number 42: i32
            localSet a: i32
                globalGet ig: i32
            localSet b: f64
                globalGet fg: f32
            localSet b: f64
                globalGet dg: f64
            localSet b: f64
                globalGet ig: i32
            localSet a: i32
                expression: i32
                    globalGet fg: f32
                    cast int: i32
            localSet a: i32
                expression: i32
                    globalGet lg: i64
                    cast int: i32
`

describe('assignment', () => {
	it('parses assignment', () => {
		const actual = '\n' + stringifyAst(parse(clean(tokenize(src)))) + '\n'
		strictEqual(actual, expected)
	})
})
