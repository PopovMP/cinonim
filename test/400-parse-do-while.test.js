'use strict'

const {strictEqual} = require('assert')
const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')
const {parse, stringifyAst} = require('../src/parser')

const src = '' +
`long foo(int n) {
	long res;
	do {
		if (n) {
			res = 42L;
			break;
		}
		res = 7L;
		continue;
	} while (n);

	return res;
}`

const expected = '' +
`module module
    function foo: i64
        funcParams foo
            parameter n: i32
        funcBody foo: i64
            localVar res: i64
            do
                loopBody
                    if
                        expression: i32
                            localGet n: i32
                        then
                            localSet res: i64
                                number 42: i64
                            break 0
                    localSet res: i64
                        number 7: i64
                    continue 0
                expression: i32
                    localGet n: i32
            return foo: i64
                localGet res: i64`

const tokens     = tokenize(src)
const cleaned    = clean(tokens)
const moduleNode = parse(cleaned)

describe('stringify AST', () => {
	it('it gets the correct string', () => {
		const actual = stringifyAst(moduleNode)
		strictEqual(actual, expected)
	})
})
