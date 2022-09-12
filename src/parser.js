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
	assignment : 'assignment',
	block      : 'block',
	break      : 'break',
	else       : 'else',
	expression : 'expression',
	funcBody   : 'funcBody',
	funcParams : 'funcParams',
	function   : 'function',
	globalConst: 'globalConst',
	globalVar  : 'globalVar',
	if         : 'if',
	localVar   : 'localVar',
	loop       : 'loop',
	module     : 'module',
	next       : 'next',
	number     : 'number',
	parameter  : 'parameter',
	return     : 'return',
	then       : 'then',
	variable   : 'variable',
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
	number: 'number'
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
 * @param {Node|null}     parent   - parent Node
 * @param {string}        type     - NodeType
 * @param {string|number} value
 * @param {string}        dataType - DataType
 *
 * @return {Node}
 */
function makeNode(parent, type, value, dataType)
{
	return {parent, type, value, dataType, nodes: [], tokens: []}
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
	const wasmModule = makeNode(null, NodeType.module, 'module', DataType.na)

	const index = 0
	parseModule(wasmModule, tokens, index)

	return wasmModule
}

/**
 * Parses a token in a module's global state
 *
 * @param {Node}    node
 * @param {Token[]} tokens
 * @param {number}  index - current token index
 *
 * @return {void}
 */
function parseModule(node, tokens, index, )
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
	if (isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.operator && t2.value === '=') {

		const dataType = dataTypeMap[t0.value]

		const globalVar = makeNode(node, NodeType.globalVar, t1.value, dataType)
		globalVar.tokens = [t0, t1, t2, t3, t4]

		const varNode = makeNode(globalVar, NodeType.variable, t1.value, dataType)
		varNode.tokens   = [t1]

		globalVar.nodes.push(varNode)

		parseExpression(globalVar, tokens, index + 3)

		node.nodes.push(globalVar)
		parseModule(node, tokens, index + 5)
		return
	}

	// Global const: const int foo = 42;
	if (t0.type === TokenType.word && t0.value === 'const' &&
		isDataType(t1) &&
		t2.type === TokenType.word &&
		t3.type === TokenType.operator && t3.value === '=') {

		const dataType = dataTypeMap[t1.value]

		const globalConst = makeNode(node, NodeType.globalConst, t2.value, dataType)
		globalConst.tokens = [t0, t1, t2, t3, t4, t5]

		const varNode = makeNode(globalConst, NodeType.variable, t2.value, dataType)
		varNode.tokens = [t2]

		globalConst.nodes.push(varNode)

		parseExpression(globalConst, tokens, index + 4)

		node.nodes.push(globalConst)
		parseModule(node, tokens, index + 6)
		return
	}

	// Function declaration: int foo(int bar, int baz) { }
	if (isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.punctuation && t2.value === '(') {

		const dataType = dataTypeMap[t0.value]
		const funcName = t1.value

		const functionNode = makeNode(node, NodeType.function, funcName, dataType)

		// Function parameters
		const funcParams = makeNode(functionNode, NodeType.funcParams, funcName, DataType.na)
		index += 3
		for (;;index++) {
			const tkn = tokens[index]
			if (tkn.type === TokenType.punctuation && tkn.value === ')')
				break
			if (tkn.type === TokenType.punctuation && tkn.value === ',')
				continue

			const tokenDataType  = tkn
			const tokenParamName = tokens[++index]
			const dataType   = dataTypeMap[tokenDataType.value]
			const paramName  = tokenParamName.value

			const param = makeNode(funcParams, NodeType.parameter, paramName, dataType)
			param.tokens = [tokenDataType, tokenParamName]

			funcParams.nodes.push(param)
		}

		// Function body
		const funcBody = makeNode(functionNode, NodeType.funcBody, funcName, dataType)
		funcBody.tokens.push(tokens[index])

		functionNode.nodes = [funcParams, funcBody]

		node.nodes.push(functionNode)

		index += 2 // eat opening "{"
		index = parseFuncBody(funcBody, tokens, index)

		parseModule(node, tokens, index)
		return
	}

	throw new Error('Unreachable parseModule')
}

/**
 * Parses a function body
 *
 * @param {Node}    funcBodyNode
 * @param {Token[]} tokens
 * @param {number}  index
 *
 * @return {number} - end index
 */
function parseFuncBody(funcBodyNode, tokens, index)
{
	// noinspection PointlessArithmeticExpressionJS
	const t0 = tokens[index + 0]
	const t1 = tokens[index + 1]
	const t2 = tokens[index + 2]

	// Function body ends with "}"
	if (t0.type === TokenType.punctuation && t0.value === '}')
		return index + 1

	// Local declaration
	// int foo;
	if (isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.punctuation && t2.value === ';') {
		const varNode = makeNode(funcBodyNode, NodeType.localVar, t1.value, dataTypeMap[t0.value])
		varNode.tokens  = [t0, t1, t2]
		funcBodyNode.nodes.push(varNode)

		return parseFuncBody(funcBodyNode, tokens, index + 3)
	}

	return parseForm(funcBodyNode, tokens, index)
}

/**
 * Parses a form: assignment | loop | block | if | funcCall
 *
 * @param {Node}    parentNode
 * @param {Token[]} tokens
 * @param {number}  index
 *
 * @return {number} - endIndex
 */
function parseForm(parentNode, tokens, index)
{
	// noinspection PointlessArithmeticExpressionJS
	const t0 = tokens[index + 0]
	const t1 = tokens[index + 1]

	// Form ends with "}"
	if (t0.type === TokenType.punctuation && t0.value === '}')
		return index + 1

	// Function return
	// return expression;
	if (t0.type === TokenType.word && t0.value === 'return') {
		const returnNode = makeNode(parentNode, NodeType.return, parentNode.value, parentNode.dataType)
		returnNode.tokens = [t0]
		parentNode.nodes.push(returnNode)

		index = parseExpression(returnNode, tokens, index + 1)

		const tokenCloseBody = tokens[index]
		if (tokenCloseBody.type === TokenType.punctuation && tokenCloseBody.value === '}')
			return index + 1

		throw new Error('Found symbols after function return: ' + tokenCloseBody.value)
	}

	// break;
	if (t0.type === TokenType.word && t0.value === 'break' &&
		t1.type === TokenType.punctuation && t1.value === ';') {
		const breakNode = makeNode(parentNode, NodeType.break, 'break', DataType.na)
		breakNode.tokens = [t0, t1]
		parentNode.nodes.push(breakNode)
		return parseForm(parentNode, tokens, index + 2)
	}

	// next;
	if (t0.type === TokenType.word && t0.value === 'next' &&
		t1.type === TokenType.punctuation && t1.value === ';') {
		const nextNode = makeNode(parentNode, NodeType.next, 'next', DataType.na)
		nextNode.tokens = [t0, t1]
		parentNode.nodes.push(nextNode)
		return parseForm(parentNode, tokens, index + 2)
	}

	// loop {
	if (t0.type === TokenType.word && t0.value === 'loop' &&
		t1.type === TokenType.punctuation && t1.value === '{') {
		const loopNode = makeNode(parentNode, NodeType.loop, 'loop', DataType.na)
		loopNode.tokens = [t0, t1]
		parentNode.nodes.push(loopNode)
		index = parseForm(loopNode, tokens, index + 2)

		return parseForm(parentNode, tokens, index)
	}

	// block {
	if (t0.type === TokenType.word && t0.value === 'block' &&
		t1.type === TokenType.punctuation && t1.value === '{') {
		const blockNode = makeNode(parentNode, NodeType.block, 'block', DataType.na)
		blockNode.tokens = [t0, t1]
		parentNode.nodes.push(blockNode)
		index = parseForm(blockNode, tokens, index + 2)

		return parseForm(parentNode, tokens, index)
	}

	// Assignment
	// foo = expression;
	if (t0.type === TokenType.word &&
		t1.type === TokenType.operator && t1.value === '=') {
		const varName = t0.value

		const varNode = lookupVar(parentNode, varName)
		if (varNode === null)
			throw new Error('Cannot find a variable: ' + varName)
		if (varNode.type === NodeType.globalConst)
			throw new Error('Cannot assign value to a constant: ' + varName)

		const assignmentNode = makeNode(parentNode, NodeType.assignment, varNode.value, varNode.dataType)
		assignmentNode.tokens = [t0, t1]
		assignmentNode.nodes  = [varNode]

		parentNode.nodes.push(assignmentNode)

		index = parseExpression(assignmentNode, tokens, index + 2)

		return parseForm(parentNode, tokens, index)
	}

	// if (expression) { FORM }
	// if (expression) { FORM } else { FORM }
	if (t0.type === TokenType.word && t0.value === 'if' &&
		t1.type === TokenType.punctuation && t1.value === '(') {

		const ifNode = makeNode(parentNode, NodeType.if, 'if', DataType.na)
		ifNode.tokens = [t0, t1]
		parentNode.nodes.push(ifNode)

		const predicate = makeNode(ifNode, NodeType.expression, 'predicate', DataType.number)
		ifNode.nodes.push(predicate)

		index = parseExpression(predicate, tokens, index + 3)

		const then = makeNode(ifNode, NodeType.then, 'then', DataType.na)
		then.tokens.push(tokens[index])
		ifNode.nodes.push(then)

		index = parseForm(then, tokens, index + 1)

		if (tokens[index].type === TokenType.word && tokens[index].value === 'else') {
			const elseNode = makeNode(ifNode, NodeType.else, 'else', DataType.na)
			elseNode.tokens.push(tokens[index])
			ifNode.nodes.push(elseNode)

			index = parseForm(elseNode, tokens, index + 2)
		}

		return parseForm(parentNode, tokens, index)
	}

	throw new Error('Unreachable parseForm')
}

/**
 * Parses an expression.
 * An expressions ends with a punctuation: ";"  ")" ",".
 *
 * @param {Node}    parentNode
 * @param {Token[]} tokens
 * @param {number}  index
 *
 * @return {number} - endIndex
 */
function parseExpression(parentNode, tokens, index)
{
	// noinspection PointlessArithmeticExpressionJS
	const t0 = tokens[index + 0]

	if (t0.type === TokenType.punctuation && [';', ',', ')'].includes(t0.value))
		return index + 1

	// Open parenthesis
	if (t0.type === TokenType.punctuation && t0.value === '(') {
		const expressionNode = makeNode(parentNode, NodeType.expression, 'parenthesis', parentNode.dataType)
		expressionNode.tokens.push(t0)
		return parseExpression(expressionNode, tokens, index + 1)
	}

	// Number
	// 42
	if (t0.type === TokenType.number) {
		const value = parentNode.dataType === DataType.i32 || parentNode.dataType === DataType.i64
			? parseInt(t0.value)
			: parseFloat(t0.value)

		const numberNode = makeNode(parentNode, NodeType.number, value, parentNode.dataType)
		numberNode.tokens = [t0]
		parentNode.nodes.push(numberNode)

		return parseExpression(parentNode, tokens, index + 1)
	}

	// Variable lookup
	// foo
	if (t0.type === TokenType.word) {
		const variableNode = lookupVar(parentNode, t0.value)
		if (variableNode === null)
			throw new Error('Cannot find a variable: ' + t0.value)
		parentNode.nodes.push(variableNode)

		return parseExpression(parentNode, tokens, index + 1)
	}

	throw new Error('Unreachable parseExpression')
}

/**
 * Searches a local variable, a function parameter or a global var/const.
 *
 * @param {Node|null} parentNode
 * @param {string}    varName
 *
 * @return {Node|null}
 */
function lookupVar(parentNode, varName)
{
	if (parentNode === null) return parentNode

	for (const node of parentNode.nodes) {
		// Local variable
		if (node.type === NodeType.localVar && node.value === varName)
			return node

		// Function parameter
		if (node.type === NodeType.funcParams) {
			for (const par of node.nodes) {
				if (par.value === varName)
					return par
			}
		}

		// Global variable
		if (node.type === NodeType.globalVar && node.value === varName)
			return node

		// Global const
		if (node.type === NodeType.globalConst && node.value === varName)
			return node
	}

	return lookupVar(parentNode.parent, varName)
}

module.exports = {
	parse,
	NodeType,
	DataType,
}
