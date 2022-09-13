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

describe('block', () => {
	it('several statements in block', () => {
		const src = `
			int foo() {
				int bar;

				block my_block {
				loop  my_loop {
					bar = 0;
					if (bar) {
						branch;
					}
					else {
						bar = 1;
						branch 0;
					}
					if (bar) {
						bar = 1;
					    branch my_block;
				    }
				}}

				return bar;
			}`
		const [funcNode] = parseModule(src)
		const [_, funcBody] = funcNode.nodes
		const [_localVar, blockNode] = funcBody.nodes

		strictEqual(typeof blockNode,   'object',       'blockNode must be an object')
		strictEqual(blockNode.type,     NodeType.block, 'blockNode.type must be NodeType.block')
		strictEqual(blockNode.value,    'my_block',     'blockNode.value must be "my_block"')
		strictEqual(blockNode.dataType, DataType.na,    'blockNode.dataType must be na')
	})
})
