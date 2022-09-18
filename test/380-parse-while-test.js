'use strict'

const {strictEqual} = require('assert')
const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')
const {parse, stringifyAst} = require('../src/parser')

const src = '' +
`long fibonacci(int n)
{
	long curr;
	long prev;
	long temp;

	curr = 1;
	prev = 1;

	while (1) {
		if (n <= 2) {
			break;
		}

		temp = curr;
		curr = prev + curr;
		prev = temp;
		n    = n - 1;
	}

	return curr;
}`

const expected = '' +
`module module
    function fibonacci: i64
        funcParams fibonacci
            parameter n: i32
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
                            binaryOperator <=: i32
                                localGet n: i32
                                number 2: i32
                        then
                            break 0
                    localSet temp: i64
                        localGet curr: i64
                    localSet curr: i64
                        binaryOperator +: i64
                            localGet prev: i64
                            localGet curr: i64
                    localSet prev: i64
                        localGet temp: i64
                    localSet n: i32
                        binaryOperator -: i32
                            localGet n: i32
                            number 1: i32
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
