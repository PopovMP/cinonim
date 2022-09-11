'use strict'

const {strictEqual} = require('assert')

const {tokenize, clean} = require('@popovmp/tokenizer')
const {describe, it}    = require('@popovmp/mocha-tiny')

const {parse, DataType, Scope, NodeType} = require('../src/parser')

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
		const [localVarNode, assignmentNode] = funcBody.nodes

		strictEqual(typeof localVarNode,     'object',            'localVarNode must be an object')
		strictEqual(localVarNode.type,       NodeType.localVar,   'localVarNode.type must be NodeType.localVar')
		strictEqual(localVarNode.value,      'bar',               'localVarNode.value must be "bar"')
		strictEqual(localVarNode.dataType,   DataType.i32,        'localVarNode.dataType must be i32')
		strictEqual(localVarNode.scope,      Scope.locale,        'localVarNode.scope must be Scope.locale')

		strictEqual(typeof assignmentNode,   'object',            'assignmentNode must be an object')
		strictEqual(assignmentNode.type,     NodeType.assignment, 'assignmentNode.type must be NodeType.assignment')
		strictEqual(assignmentNode.value,    'bar',               'assignmentNode.value must be "bar"')
		strictEqual(assignmentNode.dataType, DataType.i32,        'assignmentNode.dataType must be i32')
		strictEqual(assignmentNode.scope,    Scope.locale,        'assignmentNode.scope must be Scope.locale')

		const [varNode, expressionNode] = assignmentNode.nodes

		strictEqual(typeof varNode,         'object',          'varNode must be an object')
		strictEqual(varNode.type,           NodeType.localVar, 'varNode.type must be NodeType.localVar')
		strictEqual(varNode.value,          'bar',             'varNode.value must be "bar')
		strictEqual(varNode.dataType,       DataType.i32,      'varNode.dataType must be i32')
		strictEqual(varNode.scope,          Scope.locale,      'varNode.scope must be Scope.locale')

		strictEqual(typeof expressionNode,   'object',         'expressionNode must be an object')
		strictEqual(expressionNode.type,     NodeType.number,  'expressionNode.type must be NodeType.number')
		strictEqual(expressionNode.value,    42,               'expressionNode.value must be 42')
		strictEqual(expressionNode.dataType, DataType.i32,     'expressionNode.dataType must be i32')
		strictEqual(expressionNode.scope,    Scope.locale,     'expressionNode.scope must be Scope.locale')
	})

	it('set function parameter', () => {
		const src = `
			void foo(float bar) {
				bar = 3.14;
			}`
		const [funcNode] = parseModule(src)
		const [funcParams, funcBody] = funcNode.nodes
		const [paramNode]      = funcParams.nodes
		const [assignmentNode] = funcBody.nodes

		strictEqual(typeof paramNode,     'object',            'paramNode must be an object')
		strictEqual(paramNode.type,       NodeType.parameter,  'paramNode.type must be NodeType.parameter')
		strictEqual(paramNode.value,      'bar',               'paramNode.value must be "bar"')
		strictEqual(paramNode.dataType,   DataType.f32,        'paramNode.dataType must be ff32')
		strictEqual(paramNode.scope,      Scope.locale,        'paramNode.scope must be Scope.locale')

		strictEqual(typeof assignmentNode,   'object',            'assignmentNode must be an object')
		strictEqual(assignmentNode.type,     NodeType.assignment, 'assignmentNode.type must be NodeType.assignment')
		strictEqual(assignmentNode.value,    'bar',               'assignmentNode.value must be "bar"')
		strictEqual(assignmentNode.dataType, DataType.f32,        'assignmentNode.dataType must be f32')
		strictEqual(assignmentNode.scope,    Scope.locale,        'assignmentNode.scope must be Scope.locale')

		const [varNode, expressionNode] = assignmentNode.nodes

		strictEqual(typeof varNode,         'object',           'varNode must be an object')
		strictEqual(varNode.type,           NodeType.parameter, 'varNode.type must be NodeType.parameter')
		strictEqual(varNode.value,          'bar',              'varNode.value must be "bar')
		strictEqual(varNode.dataType,       DataType.f32,       'varNode.dataType must be f32')
		strictEqual(varNode.scope,          Scope.locale,       'varNode.scope must be Scope.locale')

		strictEqual(typeof expressionNode,   'object',         'expressionNode must be an object')
		strictEqual(expressionNode.type,     NodeType.number,  'expressionNode.type must be NodeType.number')
		strictEqual(expressionNode.value,    3.14,             'expressionNode.value must be 3.14')
		strictEqual(expressionNode.dataType, DataType.f32,     'expressionNode.dataType must be f32')
		strictEqual(expressionNode.scope,    Scope.locale,     'expressionNode.scope must be Scope.locale')
	})

	it('set global variable', () => {
		const src = `
			double bar = 0;
			void foo() {
				bar = 3.14;
			}`
		const [globalVar, funcNode] = parseModule(src)
		const [_, funcBody] = funcNode.nodes
		const [assignmentNode] = funcBody.nodes

		strictEqual(typeof globalVar,     'object',            'globalVar must be an object')
		strictEqual(globalVar.type,       NodeType.globalVar,  'globalVar.type must be NodeType.globalVar')
		strictEqual(globalVar.value,      'bar',               'globalVar.value must be "bar"')
		strictEqual(globalVar.dataType,   DataType.f64,        'globalVar.dataType must be f64')
		strictEqual(globalVar.scope,      Scope.global,        'globalVar.scope must be Scope.global')

		strictEqual(typeof assignmentNode,   'object',            'assignmentNode must be an object')
		strictEqual(assignmentNode.type,     NodeType.assignment, 'assignmentNode.type must be NodeType.assignment')
		strictEqual(assignmentNode.value,    'bar',               'assignmentNode.value must be "bar"')
		strictEqual(assignmentNode.dataType, DataType.f64,        'assignmentNode.dataType must be f64')
		strictEqual(assignmentNode.scope,    Scope.locale,        'assignmentNode.scope must be Scope.locale')

		const [varNode, expressionNode] = assignmentNode.nodes

		strictEqual(typeof varNode,         'object',           'varNode must be an object')
		strictEqual(varNode.type,           NodeType.globalVar, 'varNode.type must be NodeType.globalVar')
		strictEqual(varNode.value,          'bar',              'varNode.value must be "bar')
		strictEqual(varNode.dataType,       DataType.f64,       'varNode.dataType must be f64')
		strictEqual(varNode.scope,          Scope.global,       'varNode.scope must be Scope.global')

		strictEqual(typeof expressionNode,   'object',         'expressionNode must be an object')
		strictEqual(expressionNode.type,     NodeType.number,  'expressionNode.type must be NodeType.number')
		strictEqual(expressionNode.value,    3.14,             'expressionNode.value must be 3.14')
		strictEqual(expressionNode.dataType, DataType.f64,     'expressionNode.dataType must be f64')
		strictEqual(expressionNode.scope,    Scope.locale,     'expressionNode.scope must be Scope.locale')
	})

})
