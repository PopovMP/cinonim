'use strict'

const {strictEqual} = require('assert')

const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')

const {parse, stringifyAst} = require('../src/parser')

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
`const long bar = 2L;
double multiply(const double m, const double n) {
	return m * n;
}
double foo() {
	return multiply(4+5*(6+7*(bar+2)), bar*(bar+2));
}`
		const str = stringifyAst( parseModule(src) )
		const expected = '' +
`module module
    globalConst bar: i64
        number 2: i64
    function multiply: f64
        funcParams
            localConst m: f64
            localConst n: f64
        funcBody: f64
            return: f64
                binaryOperator *: f64
                    localGet m: f64
                    localGet n: f64
    function foo: f64
        funcParams
        funcBody: f64
            return: f64
                functionCall multiply: f64
                    expression: f64
                        number 4: f64
                        operator +: f64
                        number 5: f64
                        operator *: f64
                        expression (: f64
                            number 6: f64
                            operator +: f64
                            number 7: f64
                            operator *: f64
                            binaryOperator +: f64
                                globalGet bar: i64
                                number 2: f64
                    binaryOperator *: f64
                        globalGet bar: i64
                        binaryOperator +: f64
                            globalGet bar: i64
                            number 2: f64`
		strictEqual(str, expected)
	})
})
