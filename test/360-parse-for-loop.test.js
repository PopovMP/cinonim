'use strict'

const {strictEqual}         = require('assert')
const {tokenize, clean}     = require('@popovmp/tokenizer')
const {describe, it}        = require('@popovmp/mocha-tiny')
const {parse, stringifyAst} = require('../index.js')

const src = `
	void foo() {
		int i, j;
		
		for (;;) { break; }
		for (i = 0; ;i += 1) { break; }
		for (i = 0; i < 10; i += 1) { }
		for (i = 0, j = 10; i < 10; i += 1, j -= 1) i += j;
	}
`

const expected = `
module module
    function foo: void
        funcParams foo
        funcBody foo: void
            localVar i: i32
            localVar j: i32
            for
                statement
                condition: i32
                statement
                loopBody
                    break 0
            for
                statement
                    localSet i: i32
                        number 0: i32
                condition: i32
                statement
                    localSet i: i32
                        expression: i32
                            localGet i: i32
                            expression: i32
                                number 1: i32
                            operator +: i32
                loopBody
                    break 0
            for
                statement
                    localSet i: i32
                        number 0: i32
                condition: i32
                    expression: i32
                        localGet i: i32
                        number 10: i32
                        operator <: i32
                statement
                    localSet i: i32
                        expression: i32
                            localGet i: i32
                            expression: i32
                                number 1: i32
                            operator +: i32
                loopBody
            for
                statement
                    localSet i: i32
                        number 0: i32
                    localSet j: i32
                        number 10: i32
                condition: i32
                    expression: i32
                        localGet i: i32
                        number 10: i32
                        operator <: i32
                statement
                    localSet i: i32
                        expression: i32
                            localGet i: i32
                            expression: i32
                                number 1: i32
                            operator +: i32
                    localSet j: i32
                        expression: i32
                            localGet j: i32
                            expression: i32
                                number 1: i32
                            operator -: i32
                loopBody
                    localSet i: i32
                        expression: i32
                            localGet i: i32
                            expression: i32
                                localGet j: i32
                            operator +: i32
`

describe('assignment', () => {
	it('parses assignment', () => {
		const actual = '\n' + stringifyAst(parse(clean(tokenize(src)))) + '\n'
		strictEqual(actual, expected)
	})
})
