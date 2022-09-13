'use strict'

const {strictEqual} = require('assert')
const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')
const {parse, stringifyAst} = require('../src/parser')

const src = `
double glob = 3.14;
int foo() {
	int bar;
	block my_block {
	loop  my_loop {
		bar = 0;
		if (bar) {
			glob = 5.45;
			branch;
		} else {
			bar = 1;
			branch 0;
		}
		if (bar) {
			bar = 1;
		    branch my_block;
	    }
	    branch if (42);
	    branch my_loop if (bar);
	}}

	return bar;
}`

const expected = '' +
`module module
    globalVar glob: f64
        number 3.14: f64
    function foo: i32
        funcParams foo
        funcBody foo: i32
            localVar bar: i32
            block my_block
                loop my_loop
                    assignment bar: i32
                        localVar bar: i32
                        number 0: i32
                    if
                        predicate: number
                            localVar bar: i32
                        then
                            assignment glob: f64
                                globalVar glob: f64
                                    number 3.14: f64
                                number 5.45: f64
                            branch 0
                        else
                            assignment bar: i32
                                localVar bar: i32
                                number 1: i32
                            branch 0
                    if
                        predicate: number
                            localVar bar: i32
                        then
                            assignment bar: i32
                                localVar bar: i32
                                number 1: i32
                            branch my_block
                    branchIf 0
                        predicate: number
                            number 42: number
                    branchIf my_loop
                        predicate: number
                            localVar bar: i32
            return foo: i32
                localVar bar: i32`

const tokens     = tokenize(src)
const cleaned    = clean(tokens)
const moduleNode = parse(cleaned)

describe('stringify AST', () => {
	it('it gets the correct string', () => {
		const actual = stringifyAst(moduleNode)
		strictEqual(actual, expected)
	})
})
