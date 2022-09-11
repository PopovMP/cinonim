'use strict'

const {strictEqual} = require('assert')

const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')

const {parse, DataType} = require('../src/parser')

/**
 * Parses source code to Nodes
 * @param {string} src
 *
 * @return {Node[]}
 */
function parseModule(src)
{
	const tokens    = tokenize(src)
	const cleaned   = clean(tokens)
	const moduleNode = parse(cleaned)

	return moduleNode.nodes
}

describe('local declaration', () => {
	it('void foo() { int bar; }', () => {
		const src = `void foo() { int bar; }`
		const funcNode = parseModule(src)[0]
		const [_, funcBody] = funcNode.nodes
		const [varNode] = funcBody.nodes

		strictEqual(varNode.value, 'bar')
		strictEqual(varNode.dataType, DataType.i32)
	})

	it('void foo() { int bar; double baz; }', () => {
		const src = `void foo() { int bar; double baz; }`
		const funcNode = parseModule(src)[0]
		const [_, funcBody] = funcNode.nodes
		const [varA, varB] = funcBody.nodes

		strictEqual(varA.value, 'bar')
		strictEqual(varA.dataType, DataType.i32)
		strictEqual(varB.value, 'baz')
		strictEqual(varB.dataType, DataType.f64)
	})

})
