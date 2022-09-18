'use strict'

const {strictEqual} = require('assert')
const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')
const {parse, stringifyAst} = require('../src/parser')

const src = `
#export-func foo = myFoo
// (export "foo" (func $myFoo))

#import-func console log = void logInt(int val)
// (import "console" "log" (func $logInt (param i32)))

#import-func math pow = double mathPow(double base, double exponent)
`

const expected = `module module
    exportFunc myFoo
    importFunc logInt: void
        funcParams
            localVar val: i32
    importFunc mathPow: f64
        funcParams
            localVar base: f64
            localVar exponent: f64`

const tokens     = tokenize(src)
const cleaned    = clean(tokens)
const moduleNode = parse(cleaned)

describe('import-export', () => {
	it('it gets the correct string', () => {
		const actual = stringifyAst(moduleNode)
		strictEqual(actual, expected)
	})
})
