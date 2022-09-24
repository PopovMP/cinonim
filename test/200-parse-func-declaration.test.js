'use strict'

const {strictEqual, deepStrictEqual} = require('assert')

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

describe('func declaration', () => {
	it('int foo() { }', () => {
		const src = `int foo() { }`
		const funcDec = parseModule(src)[0]
		strictEqual(funcDec.type, NodeType.function)
		strictEqual(funcDec.value, 'foo')
		strictEqual(funcDec.dataType, DataType.i32)

		const [paramNode, funcBody] = funcDec.nodes

		deepStrictEqual(paramNode.nodes, [])
		strictEqual(funcBody.dataType, DataType.i32)
	})

	it('double bar(int a) { }', () => {
		const src = `double bar(int a) { }`
		const funcDec = parseModule(src)[0]
		strictEqual(funcDec.type, NodeType.function)
		strictEqual(funcDec.value, 'bar')
		strictEqual(funcDec.dataType, DataType.f64)

		const [paramNode, funcBody] = funcDec.nodes

		const param = paramNode.nodes[0]
		strictEqual(param.value, 'a')
		strictEqual(param.dataType, DataType.i32)

		strictEqual(funcBody.dataType, DataType.f64)
	})

	it('void baz(float a, double b) { }', () => {
		const src = `void baz(float a, double b) { }`
		const funcDec = parseModule(src)[0]
		strictEqual(funcDec.type, NodeType.function)
		strictEqual(funcDec.value, 'baz')
		strictEqual(funcDec.dataType, DataType.void)

		const [paramNode, funcBody] = funcDec.nodes

		const [paramA, paramB] = paramNode.nodes
		strictEqual(paramA.value, 'a')
		strictEqual(paramA.dataType, DataType.f32)
		strictEqual(paramB.value, 'b')
		strictEqual(paramB.dataType, DataType.f64)

		strictEqual(funcBody.dataType, DataType.void)
	})

	it('parse several functions', () => {
		const src = `
		int    foo() { }
		double bar(int a) { }
		double sum(double m, double n) return m + n;
		`
		const [funcFoo, funcBar, funcSum] = parseModule(src)

		strictEqual(typeof funcFoo,   'object',           'funcFoo must be an object')
		strictEqual(funcFoo.type,     NodeType.function,  'funcFoo.type must be NodeType.function')
		strictEqual(funcFoo.value,    'foo',              'funcFoo.value must be "foo"')
		strictEqual(funcFoo.dataType, DataType.i32,       'funcFoo.dataType must be i32')

		strictEqual(typeof funcBar,   'object',           'funcBar must be an object')
		strictEqual(funcBar.type,     NodeType.function,  'funcBar.type must be NodeType.function')
		strictEqual(funcBar.value,    'bar',              'funcBar.value must be "bar"')
		strictEqual(funcBar.dataType, DataType.f64,       'funcBar.dataType must be f64')

		strictEqual(typeof funcSum,   'object',           'funcSum must be an object')
		strictEqual(funcSum.type,     NodeType.function,  'funcSum.type must be NodeType.function')
		strictEqual(funcSum.value,    'sum',              'funcSum.value must be "sum"')
		strictEqual(funcSum.dataType, DataType.f64,       'funcSum.dataType must be f64')
	})
})
