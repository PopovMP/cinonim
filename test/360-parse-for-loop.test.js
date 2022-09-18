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

describe('parse `for` loop', () => {

	it('for loop', () => {
		const src = '' +
`int sum(const int max) {
	int i;
	int res;

	res = 0;
	for (i = 0; i < max; i = i + 1) {
		res = res + i;
	}

	return res;
}`
		const str = stringifyAst( parseModule(src) )
		const expected = '' +
`module module
    function sum: i32
        funcParams
            localConst max: i32
        funcBody: i32
            localVar i: i32
            localVar res: i32
            localSet res: i32
                number 0: i32
            for
                statement
                    localSet i: i32
                        number 0: i32
                condition: i32
                    binaryOperator <: i32
                        localGet i: i32
                        localGet max: i32
                statement
                    localSet i: i32
                        binaryOperator +: i32
                            localGet i: i32
                            number 1: i32
                loopBody
                    localSet res: i32
                        binaryOperator +: i32
                            localGet res: i32
                            localGet i: i32
            return: i32
                localGet res: i32`
		strictEqual(str, expected)
	})
})
