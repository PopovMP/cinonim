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

describe('loop', () => {

	it('empty loop', () => {
		const src = `
			int foo() {
				int bar;
				bar = 42;

				loop {
				}
				
				return bar;
			}`
		const funcNode = parseModule(src)[0]
		const [_, funcBody] = funcNode.nodes
		const [_localVar, _assign, loopNode] = funcBody.nodes

		strictEqual(typeof loopNode,     'object',      'loopNode must be an object')
		strictEqual(loopNode.type,       NodeType.loop, 'loopNode.type must be NodeType.loop')
		strictEqual(loopNode.value,      'loop',        'loopNode.value must be "loop"')
		strictEqual(loopNode.dataType,   DataType.na,   'loopNode.dataType must be na')
	})

	it('one statement in loop', () => {
		const src = `
			int foo() {
				int bar;

				loop {
					bar = 42;
				}
				
				return bar;
			}`
		const funcNode = parseModule(src)[0]
		const [_, funcBody] = funcNode.nodes
		const [_localVar, loopNode, _assign] = funcBody.nodes

		strictEqual(typeof loopNode,     'object',      'loopNode must be an object')
		strictEqual(loopNode.type,       NodeType.loop, 'loopNode.type must be NodeType.loop')
		strictEqual(loopNode.value,      'loop',        'loopNode.value must be "loop"')
		strictEqual(loopNode.dataType,   DataType.na,   'loopNode.dataType must be na')
	})

	it('several statements in loop', () => {
		const src = `
			int foo() {
				int bar;

				loop {
					bar = 42;
					if (bar) { 
						next;
					}
				}
				
				return bar;
			}`
		const funcNode = parseModule(src)[0]
		const [_, funcBody] = funcNode.nodes
		const [_localVar, loopNode] = funcBody.nodes

		strictEqual(typeof loopNode,     'object',      'loopNode must be an object')
		strictEqual(loopNode.type,       NodeType.loop, 'loopNode.type must be NodeType.loop')
		strictEqual(loopNode.value,      'loop',        'loopNode.value must be "loop"')
		strictEqual(loopNode.dataType,   DataType.na,   'loopNode.dataType must be na')
	})
})
