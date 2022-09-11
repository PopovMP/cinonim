/**
 * @typedef {Object} Token
 *
 * @property {number} line
 * @property {number} column
 * @property {string} type - space, eol, comment, pragma, punctuation, operator, word, number, string, character
 * @property {string} value
 */

/**
 * @typedef {Object} Node
 *
 * @property {string}    type
 * @property {*}         value    - value
 * @property {string}    dataType - na, i32, i64, f32, f64, string, char, void
 * @property {string}    scope    - global, local
 * @property {Node[]}    nodes    - list of underlying nodes
 * @property {Token[]}   tokens
 * @property {Node|null} parent
 */

const TokenType = {
	character  : 'character',
	comment    : 'comment',
	eol        : 'eol',
	number     : 'number',
	operator   : 'operator',
	pragma     : 'pragma',
	punctuation: 'punctuation',
	space      : 'space',
	string     : 'string',
	word       : 'word',
}

const NodeType = {
	funcBody   : 'funcBody',
	funcParams : 'funcParams',
	function   : 'function',
	globalConst: 'globalConst',
	globalVar  : 'globalVar',
	localVar   : 'localVar',
	module     : 'module',
	number     : 'number',
	parameter  : 'parameter',
	variable   : 'variable',
}

const Scope = {
	na    : 'na',
	global: 'global',
	locale: 'local',
}

const DataType = {
	na    : 'na',
	i32   : 'i32',
	i64   : 'i64',
	f32   : 'f32',
	f64   : 'f64',
	string: 'string',
	char  : 'char',
	void  : 'void',
}

/** @type {string[]} */
const dataTypes = ['int', 'long', 'float', 'double', 'string', 'character', 'char', 'void']

const dataTypeMap = {
	int      : DataType.i32,
	long     : DataType.i64,
	float    : DataType.f32,
	double   : DataType.f64,
	string   : DataType.string,
	char     : DataType.char,
	character: DataType.char,
	void     : DataType.void,
}

/**
 * Makes a new node
 *
 * @param {Node|null} parent
 * @param {string}   type
 * @param {*}        [value]
 * @param {string}   [dataType]
 *
 * @return {Node}
 */
function makeNode(parent, type, value = undefined, dataType = DataType.na)
{
	return {
		parent,
		type,
		value,
		dataType,
		scope   : Scope.na,
		nodes   : [],
		tokens  : [],
	}
}

/**
 * Checks if the token is a data type
 *
 * @param {Token} token
 *
 * @return {boolean}
 */
function isDataType(token)
{
	return token.type === TokenType.word && dataTypes.includes(token.value)
}

/**
 * Parses tokens to AST
 *
 * @param {Token[]} tokens
 *
 * @return {Node}
 */
function parse(tokens)
{
	const wasmModule = makeNode(null, NodeType.module)
	wasmModule.scope = Scope.global

	const index = 0
	parserLoop(tokens, index, wasmModule)

	return wasmModule
}

/**
 * Parses a token
 *
 * @param {Token[]} tokens
 * @param {number} index - current token index
 * @param {Node} node
 */
function parserLoop(tokens, index, node)
{
	if (index === tokens.length) return

	// noinspection PointlessArithmeticExpressionJS
	const t0 = tokens[index + 0]
	const t1 = tokens[index + 1]
	const t2 = tokens[index + 2]
	const t3 = tokens[index + 3]
	const t4 = tokens[index + 4]
	const t5 = tokens[index + 5]

	// Global variable: int foo = 42;
	if (node.scope === Scope.global &&
		isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.operator && t2.value === '=') {

		const dataType = dataTypeMap[t0.value]

		const globalVar = makeNode(node, NodeType.globalVar, t1.value, dataType)
		globalVar.scope  = Scope.global
		globalVar.tokens = [t0, t1, t2, t3, t4]

		const varNode = makeNode(globalVar, NodeType.variable, t1.value)
		varNode.scope    = Scope.global
		varNode.dataType = dataType
		varNode.tokens   = [t1]

		const numberNode = parseExpression(globalVar, tokens, index + 3)

		globalVar.nodes = [varNode, numberNode]

		node.nodes.push(globalVar)
		return parserLoop(tokens, index + 5, node)
	}

	// Global const: const int foo = 42;
	if (node.scope === Scope.global &&
		t0.type === TokenType.word && t0.value === 'const' &&
		isDataType(t1) &&
		t2.type === TokenType.word &&
		t3.type === TokenType.operator && t3.value === '=') {

		const dataType = dataTypeMap[t1.value]

		const globalConst = makeNode(node, NodeType.globalConst, t2.value, dataType)
		globalConst.scope  = Scope.global
		globalConst.tokens = [t0, t1, t2, t3, t4, t5]

		const varNode = makeNode(globalConst, NodeType.variable, t2.value, dataType)
		varNode.scope  = Scope.global
		varNode.tokens = [t2]

		const numberNode = parseExpression(globalConst, tokens, index + 4)

		globalConst.nodes = [varNode, numberNode]

		node.nodes.push(globalConst)
		return parserLoop(tokens, index + 6, node)
	}

	// Function declaration: int foo(int bar, int baz) { }
	if (node.scope === Scope.global &&
		isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.punctuation && t2.value === '(') {

		const dataType = dataTypeMap[t0.value]
		const funcName = t1.value

		const functionNode = makeNode(node, NodeType.function, funcName, dataType)

		const funcParams = makeNode(functionNode, NodeType.funcParams, funcName)
		let endIndex = index + 3
		for (;;endIndex++) {
			const tkn = tokens[endIndex]
			if (tkn.type === TokenType.punctuation && tkn.value === ')')
				break
			if (tkn.type === TokenType.punctuation && tkn.value === ',')
				continue

			const tDataType  = tkn
			const tParamName = tokens[++endIndex]
			const dataType   = dataTypeMap[tDataType.value]
			const paramName  = tParamName.value

			const param = makeNode(funcParams, NodeType.parameter, paramName, dataType)
			param.scope  = Scope.locale
			param.tokens = [tDataType, tParamName]

			funcParams.nodes.push(param)
		}

		const funcBody = makeNode(functionNode, NodeType.funcBody, funcName, dataType)

		// Function body
		endIndex += 2
		const bodyStart = endIndex
		for (let openBraces = 1; openBraces > 0; endIndex++) {
			const tkn = tokens[endIndex]
			if (tkn.type === TokenType.punctuation && tkn.value === '{')
				openBraces += 1
			if (tkn.type === TokenType.punctuation && tkn.value === '}')
				openBraces -= 1
		}

		const bodyEnd = endIndex
		parseFuncBody(funcBody, tokens.slice(bodyStart, bodyEnd), 0)

		functionNode.nodes = [funcParams, funcBody]

		node.nodes.push(functionNode)
		return parserLoop(tokens, endIndex, node)
	}

}

/**
 * Parses an expression
 *
 * @param {Node}    node
 * @param {Token[]} tokens
 * @param {number}  index
 *
 * @return {Node}
 */
function parseExpression(node, tokens, index)
{
	// noinspection PointlessArithmeticExpressionJS
	const t0 = tokens[index + 0]

	if (t0.type === TokenType.number) {
		const value = node.dataType === DataType.i32 || node.dataType === DataType.i64
			? parseInt(t0.value)
			: parseFloat(t0.value)
		const numberNode = makeNode(node, NodeType.number, value)
		numberNode.dataType = node.dataType
		numberNode.tokens   = [t0]

		return numberNode
	}
}

/**
 * Parses a function body
 *
 * @param {Node}    funcBodyNode
 * @param {Token[]} tokens
 * @param {number}  index
 *
 * @return {void}
 */
function parseFuncBody(funcBodyNode, tokens, index)
{
	// noinspection PointlessArithmeticExpressionJS
	const t0 = tokens[index + 0]
	const t1 = tokens[index + 1]
	const t2 = tokens[index + 2]

	// Local declaration
	// int foo;
	if (isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.punctuation && t2.value === ';') {
		const varNode = makeNode(funcBodyNode, NodeType.localVar, t1.value, dataTypeMap[t0.value])
		varNode.scope   = Scope.locale
		varNode.tokens  = [t0, t1, t2]
		funcBodyNode.nodes.push(varNode)
		parseFuncBody(funcBodyNode, tokens, index + 3)
	}

}

module.exports = {
	parse,
	NodeType,
	DataType,
}
