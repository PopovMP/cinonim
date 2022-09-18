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

describe('variable set', () => {
	it('set local variable', () => {
		const src = `
			void foo() {
				int bar;
				bar = 42;
			}`
		const funcNode = parseModule(src)[0]
		const [_, funcBody] = funcNode.nodes
		const [localVarNode, localSet] = funcBody.nodes

		strictEqual(typeof localVarNode,     'object',          'localVarNode must be an object')
		strictEqual(localVarNode.type,       NodeType.localVar, 'localVarNode.type must be NodeType.localVar')
		strictEqual(localVarNode.value,      'bar',             'localVarNode.value must be "bar"')
		strictEqual(localVarNode.dataType,   DataType.i32,      'localVarNode.dataType must be i32')

		strictEqual(typeof localSet,   'object',          'localSet must be an object')
		strictEqual(localSet.type,     NodeType.localSet, 'localSet.type must be NodeType.localSet')
		strictEqual(localSet.value,    'bar',             'localSet.value must be "bar"')
		strictEqual(localSet.dataType, DataType.i32,      'localSet.dataType must be i32')

		const [numberNode] = localSet.nodes

		strictEqual(typeof numberNode,   'object',         'numberNode must be an object')
		strictEqual(numberNode.type,     NodeType.number,  'numberNode.type must be NodeType.number')
		strictEqual(numberNode.value,    42,               'numberNode.value must be 42')
		strictEqual(numberNode.dataType, DataType.i32,     'numberNode.dataType must be i32')
	})

	it('set two local variable', () => {
		const src = `
			void foo() {
				int   bar;
				float baz;
				bar =   42;
				baz = 3.14;
			}`
		const funcNode = parseModule(src)[0]
		const [_, funcBody] = funcNode.nodes
		const [localBar, localBaz, assignBar, assignBaz] = funcBody.nodes

		strictEqual(typeof localBar,     'object',            'localBar must be an object')
		strictEqual(localBar.type,       NodeType.localVar,   'localBar.type must be NodeType.localVar')
		strictEqual(localBar.value,      'bar',               'localBar.value must be "bar"')
		strictEqual(localBar.dataType,   DataType.i32,        'localBar.dataType must be i32')

		strictEqual(typeof localBaz,     'object',            'localBaz must be an object')
		strictEqual(localBaz.type,       NodeType.localVar,   'localBaz.type must be NodeType.localVar')
		strictEqual(localBaz.value,      'baz',               'localBaz.value must be "baz"')
		strictEqual(localBaz.dataType,   DataType.f32,        'localBaz.dataType must be f32')

		strictEqual(typeof assignBar,   'object',            'assignBar must be an object')
		strictEqual(assignBar.type,     NodeType.localSet,   'assignBar.type must be NodeType.localSet')
		strictEqual(assignBar.value,    'bar',               'assignBar.value must be "bar"')
		strictEqual(assignBar.dataType, DataType.i32,        'assignBar.dataType must be i32')

		const [exprBar] = assignBar.nodes
		strictEqual(typeof exprBar,   'object',         'exprBar must be an object')
		strictEqual(exprBar.type,     NodeType.number,  'exprBar.type must be NodeType.number')
		strictEqual(exprBar.value,    42,               'exprBar.value must be 42')
		strictEqual(exprBar.dataType, DataType.i32,     'exprBar.dataType must be i32')

		const [exprBaz] = assignBaz.nodes
		strictEqual(typeof exprBaz,   'object',         'exprBaz must be an object')
		strictEqual(exprBaz.type,     NodeType.number,  'exprBaz.type must be NodeType.number')
		strictEqual(exprBaz.value,    3.14,             'exprBaz.value must be 3.14')
		strictEqual(exprBaz.dataType, DataType.f32,     'exprBaz.dataType must be f32')

	})

	it('set function parameter', () => {
		const src = `
			void foo(float bar) {
				bar = 3.14;
			}`
		const [funcNode] = parseModule(src)
		const [funcParams, funcBody] = funcNode.nodes
		const [paramNode]      = funcParams.nodes
		const [localSet] = funcBody.nodes

		strictEqual(typeof paramNode,     'object',            'paramNode must be an object')
		strictEqual(paramNode.type,       NodeType.localVar,  'paramNode.type must be NodeType.localVar')
		strictEqual(paramNode.value,      'bar',               'paramNode.value must be "bar"')
		strictEqual(paramNode.dataType,   DataType.f32,        'paramNode.dataType must be ff32')

		strictEqual(typeof localSet,   'object',          'localSet must be an object')
		strictEqual(localSet.type,     NodeType.localSet, 'localSet.type must be NodeType.localSet')
		strictEqual(localSet.value,    'bar',             'localSet.value must be "bar"')
		strictEqual(localSet.dataType, DataType.f32,      'localSet.dataType must be f32')

		const [numberNode] = localSet.nodes

		strictEqual(typeof numberNode,         'object',        'numberNode must be an object')
		strictEqual(numberNode.type,           NodeType.number, 'numberNode.type must be NodeType.parameter')
		strictEqual(numberNode.value,          3.14,            'numberNode.value must be 3.14')
		strictEqual(numberNode.dataType,       DataType.f32,    'numberNode.dataType must be f32')
	})

	it('set global variable', () => {
		const src = `
			double bar = 0;
			void foo() {
				bar = 3.14;
			}`
		const [globalVar, funcNode] = parseModule(src)
		const [_, funcBody] = funcNode.nodes
		const [globalSet] = funcBody.nodes

		strictEqual(typeof globalVar,     'object',            'globalVar must be an object')
		strictEqual(globalVar.type,       NodeType.globalVar,  'globalVar.type must be NodeType.globalVar')
		strictEqual(globalVar.value,      'bar',               'globalVar.value must be "bar"')
		strictEqual(globalVar.dataType,   DataType.f64,        'globalVar.dataType must be f64')

		strictEqual(typeof globalSet,   'object',           'globalSet must be an object')
		strictEqual(globalSet.type,     NodeType.globalSet, 'globalSet.type must be NodeType.globalSet')
		strictEqual(globalSet.value,    'bar',              'globalSet.value must be "bar"')
		strictEqual(globalSet.dataType, DataType.f64,       'globalSet.dataType must be f64')

		const [numberNode] = globalSet.nodes
		strictEqual(typeof numberNode,   'object',         'numberNode must be an object')
		strictEqual(numberNode.type,     NodeType.number,  'numberNode.type must be NodeType.number')
		strictEqual(numberNode.value,    3.14,             'numberNode.value must be 3.14')
		strictEqual(numberNode.dataType, DataType.f64,     'numberNode.dataType must be f64')
	})
})
