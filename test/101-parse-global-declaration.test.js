'use strict'

const {strictEqual} = require('assert')

const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')

const {parse, DataType, NodeType} = require('../index.js')

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

describe('global', () => {
	it('int foo = 42;', () => {
		const src = `int foo = 42;`
		const globalVar = parseModule(src)[0]
		strictEqual(globalVar.type, NodeType.globalVar)
		strictEqual(globalVar.dataType, DataType.i32)

		const [numNode] = globalVar.nodes

		strictEqual(globalVar.value,    'foo')
		strictEqual(globalVar.dataType, DataType.i32)
		strictEqual(numNode.value, 42)
		strictEqual(numNode.dataType, DataType.i32)
	})

	it('long foo = 42;', () => {
		const src = `long foo = 42;`
		const globalVar = parseModule(src)[0]
		strictEqual(globalVar.type, NodeType.globalVar)
		strictEqual(globalVar.dataType, DataType.i64)

		const [numNode] = globalVar.nodes

		strictEqual(globalVar.value, 'foo')
		strictEqual(globalVar.dataType, DataType.i64)
		strictEqual(numNode.value, 42)
		strictEqual(numNode.dataType, DataType.i64)
	})

	it('float foo = 3.14;', () => {
		const src = `float foo = 3.14;`
		const [numNode] = parseModule(src)[0].nodes

		strictEqual(numNode.value, 3.14)
		strictEqual(numNode.dataType, DataType.f32)
	})

	it('double foo = 3.14;', () => {
		const src = `double foo = 3.14;`
		const [numNode] = parseModule(src)[0].nodes

		strictEqual(numNode.value, 3.14)
		strictEqual(numNode.dataType, DataType.f64)
	})

	it('const double foo = 3.14;', () => {
		const src = `const double foo = 3.14;`
		const globalVar = parseModule(src)[0]
		strictEqual(globalVar.type, NodeType.globalConst)
		strictEqual(globalVar.dataType, DataType.f64)

		const [numNode] = globalVar.nodes

		strictEqual(globalVar.dataType, DataType.f64)
		strictEqual(numNode.value, 3.14)
		strictEqual(numNode.dataType, DataType.f64)
	})
})
