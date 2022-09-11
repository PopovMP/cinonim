'use strict'

const {strictEqual, deepStrictEqual} = require('assert')

const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')

const {parse, DataType, NodeType} = require('../src/parser')

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

describe('func body', () => {
	it('void foo() { { { } } }', () => {
		const src = `void foo() { { { } } }`
		const funcDec = parseModule(src)[0]
		strictEqual(funcDec.type, NodeType.function)
		strictEqual(funcDec.value, 'foo')
		strictEqual(funcDec.dataType, DataType.void)

		const [paramNode, funcBody] = funcDec.nodes

		deepStrictEqual(paramNode.nodes, [])
		strictEqual(funcBody.value, 'foo')
		strictEqual(funcBody.dataType, DataType.void)
	})
})
