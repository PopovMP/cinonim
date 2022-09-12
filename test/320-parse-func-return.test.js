'use strict'

const {strictEqual} = require('assert')

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
	const tokens     = tokenize(src)
	const cleaned    = clean(tokens)
	const moduleNode = parse(cleaned)

	return moduleNode.nodes
}

describe('function return', () => {
	it('return number', () => {
		const src = `
			float foo() {
				return 3.14;
			}`
		const [funcNode]    = parseModule(src)
		const [_, funcBody] = funcNode.nodes
		const [returnNode]  = funcBody.nodes
		const [numberNode]  = returnNode.nodes

		strictEqual(typeof funcNode,   'object',           'funcNode must be an object')
		strictEqual(funcNode.type,     NodeType.function,  'funcNode.type must be NodeType.function')
		strictEqual(funcNode.value,    'foo',              'funcNode.value must be "foo"')
		strictEqual(funcNode.dataType, DataType.f32,       'funcNode.dataType must be f32')

		strictEqual(typeof returnNode,    'object',        'returnNode must be an object')
		strictEqual(returnNode.type,      NodeType.return, 'returnNode.type must be NodeType.return')
		strictEqual(returnNode.value,     'foo',           'returnNode.value must be "foo"')
		strictEqual(returnNode.dataType,  DataType.f32,    'returnNode.dataType must be f32')

		strictEqual(typeof numberNode,    'object',        'numberNode must be an object')
		strictEqual(numberNode.type,      NodeType.number, 'numberNode.type must be NodeType.number')
		strictEqual(numberNode.value,     3.14,            'numberNode.value must be 3.14')
		strictEqual(numberNode.dataType,  DataType.f32,    'numberNode.dataType must be f32')
	})
})
