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
double square(double m, double n) {
	return m * n;
}
double foo() {
	return square(4+5*(6+7*(bar+2)), bar*(bar+2));
}`
		const str = stringifyAst( parseModule(src) )
		const expected = '' +
`module module
    globalConst bar: i64
        number 2: i64
    function square: f64
        funcParams square
            parameter m: f64
            parameter n: f64
        funcBody square: f64
            return square: f64
                expression: f64
                    localGet m: f64
                    operator *: f64
                    localGet n: f64
    function foo: f64
        funcParams foo
        funcBody foo: f64
            return foo: f64
                functionCall square: f64
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
                            expression (: f64
                                globalGet bar: i64
                                operator +: f64
                                number 2: f64
                    expression: f64
                        globalGet bar: i64
                        operator *: f64
                        expression (: f64
                            globalGet bar: i64
                            operator +: f64
                            number 2: f64`
		strictEqual(str, expected)
	})
})
