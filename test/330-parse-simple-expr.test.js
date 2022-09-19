'use strict'

const {strictEqual} = require('assert')

const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')

const {parse, stringifyAst} = require('../index.js')

/**
 * Parses source code to Nodes
 * @param {string} src
 *
 * @return {Node}
 */
function parseModule(src)
{
	const tokens  = tokenize(src)
	const cleaned = clean(tokens)
	return parse(cleaned)
}

describe('parse expression chain', () => {

	it('expr two', () => {
		const src = '' +
`void foo() {
	int out;
	out = 1+2;
	out = 1+(2+3);
	out = (1+2)*(3+4);
	out = (1+2)*3;
	out = -out;
}`
		const str = stringifyAst( parseModule(src) )
		const expected = '' +
`module module
    function foo: void
        funcParams foo
        funcBody foo: void
            localVar out: i32
            localSet out: i32
                expression: i32
                    number 1: i32
                    number 2: i32
                    operator +: i32
            localSet out: i32
                expression: i32
                    number 1: i32
                    expression: i32
                        number 2: i32
                        number 3: i32
                        operator +: i32
                    operator +: i32
            localSet out: i32
                expression: i32
                    expression: i32
                        number 1: i32
                        number 2: i32
                        operator +: i32
                    expression: i32
                        number 3: i32
                        number 4: i32
                        operator +: i32
                    operator *: i32
            localSet out: i32
                expression: i32
                    expression: i32
                        number 1: i32
                        number 2: i32
                        operator +: i32
                    number 3: i32
                    operator *: i32
            localSet out: i32
                expression: i32
                    localGet out: i32
                    operator -: i32`
		strictEqual(str, expected)
	})
})
