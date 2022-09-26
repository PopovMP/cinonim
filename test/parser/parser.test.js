'use strict'

const {strictEqual}  = require('assert')
const {readFileSync} = require('fs')
const {describe, it} = require('@popovmp/mocha-tiny')
const {tokenize}     = require('../../lib/tokenizer')
const {parse, stringifyAst} = require('../../lib/parser')

describe('Parser', () => {
	it('parses source code', () => {
		const sourceFilename = __filename.replace('.js', '.c')
		const targetFilename = __filename.replace('.js', '.txt')

		const sourceFile = readFileSync(sourceFilename, {encoding: 'ascii'})
		const targetFile = readFileSync(targetFilename, {encoding: 'ascii'})

		const tokens     = tokenize(sourceFile)
		const moduleNode = parse(tokens)
		const astText    = stringifyAst(moduleNode)

		const actual = astText.replaceAll('\n', '\r\n') + '\r\n'

		strictEqual(actual, targetFile)
	})
})
