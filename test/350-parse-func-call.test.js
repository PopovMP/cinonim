'use strict'

const {strictEqual}         = require('assert')
const {tokenize, clean}     = require('@popovmp/tokenizer')
const {describe, it}        = require('@popovmp/mocha-tiny')
const {parse, stringifyAst} = require('../index.js')

const src = `
void foo(const int a, float b)
{
	if (a > 0)
		return foo(0, b);
}

double bar(double n)
{
	foo(1+2, 3);
	return n;
}

void baz()
{
	double m;
	m = bar(m);
}
`

const expected = `
module module
    function foo: void
        funcParams foo
            localConst a: i32
            localVar b: f32
        funcBody foo: void
            if
                condition: i32
                    expression: i32
                        localGet a: i32
                        number 0: i32
                        operator >: i32
                then
                    return foo: void
                        functionCall foo: void
                            number 0: i32
                            localGet b: f32
    function bar: f64
        funcParams bar
            localVar n: f64
        funcBody bar: f64
            functionCall foo: void
                expression: i32
                    number 1: i32
                    number 2: i32
                    operator +: i32
                number 3: f32
            return bar: f64
                localGet n: f64
    function baz: void
        funcParams baz
        funcBody baz: void
            localVar m: f64
            localSet m: f64
                functionCall bar: f64
                    localGet m: f64
`

describe('assignment', () => {
	it('parses assignment', () => {
		const actual = '\n' + stringifyAst(parse(clean(tokenize(src)))) + '\n'
		strictEqual(actual, expected)
	})
})
