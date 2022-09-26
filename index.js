'use strict'

const {tokenize} = require('./lib/tokenizer')
const {parse}    = require('./lib/parser')
const {astToWat} = require('./lib/watter')

function ciToWat(sourceCode)
{
	const tokens = tokenize(sourceCode)
	const ast    = parse(tokens)

	return astToWat(ast)
}

module.exports = {
	ciToWat,
}
