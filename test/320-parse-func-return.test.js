'use strict'

const {strictEqual}         = require('assert')
const {tokenize, clean}     = require('@popovmp/tokenizer')
const {describe, it}        = require('@popovmp/mocha-tiny')
const {parse, stringifyAst} = require('../index.js')

const src = `
	void foo() {
		return;
	}
	
	void bar() {
		while(1) {
			return;
		}
	}
	
	float baz(float n) {
		while(1) {
			return n;
		}
	
		return n + 2;
	}
`

const expected = `
module module
    function foo: void
        funcParams foo
        funcBody foo: void
            return foo: void
    function bar: void
        funcParams bar
        funcBody bar: void
            while
                condition: i32
                    number 1: i32
                loopBody
                    return bar: void
    function baz: f32
        funcParams baz
            localVar n: f32
        funcBody baz: f32
            while
                condition: i32
                    number 1: i32
                loopBody
                    return baz: f32
                        localGet n: f32
            return baz: f32
                expression: f32
                    localGet n: f32
                    number 2: f32
                    operator +: f32
`

describe('return', () => {
	it('parses return', () => {
		const actual = '\n' + stringifyAst(parse(clean(tokenize(src)))) + '\n'
		strictEqual(actual, expected)
	})
})
