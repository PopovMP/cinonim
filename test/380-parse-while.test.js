'use strict'

const {strictEqual} = require('assert')
const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')
const {parse, stringifyAst} = require('../index.js')

const src = '' +
`long fibonacci(int n)
{
	long curr, prev, temp;

	curr = 1;
	prev = 1;

	while (1) {
		if (n <= 2)
			break;

		temp  = curr;
		curr += prev;
		prev  = temp;
		n    -= 1;
	}

	return curr;
}`

const expected = '' +
`module module
    function fibonacci: i64
        funcParams fibonacci
            localVar n: i32
        funcBody fibonacci: i64
            localVar curr: i64
            localVar prev: i64
            localVar temp: i64
            localSet curr: i64
                number 1: i64
            localSet prev: i64
                number 1: i64
            while
                condition: i32
                    number 1: i32
                loopBody
                    if
                        condition: i32
                            expression: i32
                                localGet n: i32
                                number 2: i32
                                operator <=: i32
                        then
                            break 0
                    localSet temp: i64
                        localGet curr: i64
                    localSet curr: i64
                        expression: i64
                            localGet curr: i64
                            expression: i64
                                localGet prev: i64
                            operator +: i64
                    localSet prev: i64
                        localGet temp: i64
                    localSet n: i32
                        expression: i32
                            localGet n: i32
                            expression: i32
                                number 1: i32
                            operator -: i32
            return fibonacci: i64
                localGet curr: i64`

const tokens     = tokenize(src)
const cleaned    = clean(tokens)
const moduleNode = parse(cleaned)

describe('stringify AST', () => {
	it('it gets the correct string', () => {
		const actual = stringifyAst(moduleNode)
		strictEqual(actual, expected)
	})
})
