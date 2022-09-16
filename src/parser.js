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
 * @property {string}    dataType - na, i32, i64, f32, f64, void
 * @property {Node[]}    nodes    - list of underlying nodes
 * @property {Token[]}   tokens
 * @property {Node|null} parent
 */

/**
 * TokenType
 * @enum {string}
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
	keyword    : 'keyword'
}

const NodeType = {
	assignment : 'assignment',
	block      : 'block',
	branch     : 'branch',
	branchIf   : 'branchIf',
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
	number     : 'number',
	parameter  : 'parameter',
	predicate  : 'predicate',
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
	void  : 'void',
	number: 'number'
}

/** @type {string[]} */
const dataTypes = ['int', 'long', 'float', 'double', 'void']

const dataTypeMap = {
	int      : DataType.i32,
	long     : DataType.i64,
	float    : DataType.f32,
	double   : DataType.f64,
	void     : DataType.void,
}

// noinspection JSUnusedLocalSymbols
const operatorPrecedence = {
	'('   : 18, ')': 18,
	'['   : 17, ']': 17, 'funcCall': 17,
	'..++': 15, '..--': 15, // Postfix increment, decrement
	'++..': 14, '--..': 14, // Prefix  increment, decrement
	'-..' : 14,             // Negate
	'**'  : 13, '^' : 13,   // Power
	'*'   : 12, '/' : 12, '%': 12,
	'+'   : 11, '-' : 11,
	'<'   : 9,  '<=': 9,  '>': 9, '>=': 9,
	'=='  : 8, '!=' : 8,
	'&&'  : 4,
	'||'  : 3,
	'?:'  : 2, // Ternary operator
	','   : 1, // Comma sequence
}

/**
 * Makes a new node
 *
 * @param {Node|null}     parent   - parent Node
 * @param {string}        type     - NodeType
 * @param {string|number} value    - variable name, function name, number, ...
 * @param {string}        dataType - DataType
 * @param {Token[]}       [tokens] - based tokens
 *
 * @return {Node}
 */
function makeNode(parent, type, value, dataType, tokens = [])
{
	const node = {parent, type, value, dataType, tokens, nodes: []}

	if (parent !== null)
		parent.nodes.push(node)

	return node
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
	return token.type === TokenType.keyword && dataTypes.includes(token.value)
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
	const moduleNode = makeNode(null, NodeType.module, 'module', DataType.na)

	const index = 0
	parseModule(moduleNode, tokens, index)

	return moduleNode
}

/**
 * Parses a token in a module's global state
 *
 * @param {Node}    moduleNode
 * @param {Token[]} tokens
 * @param {number}  index - current token index
 *
 * @return {void}
 */
function parseModule(moduleNode, tokens, index, )
{
	if (index === tokens.length) return

	const t0 = tokens[index];
	const t1 = tokens[index+1]
	const t2 = tokens[index+2]
	const t3 = tokens[index+3]

	// Global variable: int foo = 42;
	if (isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.operator && t2.value === '=') {

		const globalVar = makeNode(moduleNode, NodeType.globalVar, t1.value, dataTypeMap[t0.value], [t0, t1])
		parseExpression(globalVar, tokens, index+3)

		return parseModule(moduleNode, tokens, index+5)
	}

	// Global const: const int foo = 42;
	if (t0.type === TokenType.keyword && t0.value === 'const' &&
		isDataType(t1) &&
		t2.type === TokenType.word &&
		t3.type === TokenType.operator && t3.value === '=') {

		const globalConst = makeNode(moduleNode, NodeType.globalConst, t2.value, dataTypeMap[t1.value], [t0, t1, t2])
		parseExpression(globalConst, tokens, index+4)

		return parseModule(moduleNode, tokens, index+6)
	}

	// Function declaration: int foo(int bar, int baz) { }
	if (isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.punctuation && t2.value === '(') {

		const dataType = dataTypeMap[t0.value]
		const funcName = t1.value

		const funcNode   = makeNode(moduleNode, NodeType.function, funcName, dataType)
		const funcParams = makeNode(funcNode, NodeType.funcParams, funcName, DataType.na)
		const funcBody   = makeNode(funcNode, NodeType.funcBody, funcName, dataType)

		index = parseFuncParams(funcParams, tokens, index+3)
		index = parseFuncBody(funcBody, tokens, index+1)

		return parseModule(moduleNode, tokens, index)
	}

	throw new Error('Unreachable parseModule')
}

/**
 *
 * @param {Node}    funcParams
 * @param {Token[]} tokens
 * @param {number}  index - current token index
 *
 * @return {number} - last consumed token index
 */
function parseFuncParams(funcParams, tokens, index)
{
	for (;;index += 1) {
		const t0 = tokens[index]
		const t1 = tokens[index+1]

		if (t0.type === TokenType.punctuation && t0.value === ')') break
		if (t0.type === TokenType.punctuation && t0.value === ',') continue
		index += 1 // Eats param name

		makeNode(funcParams, NodeType.parameter, t1.value, dataTypeMap[t0.value], [t0, t1])
	}

	// eats last ")"
	return index+1
}

/**
 * Parses a function body
 *
 * @param {Node}    funcBody
 * @param {Token[]} tokens
 * @param {number}  index
 *
 * @return {number} - end index
 */
function parseFuncBody(funcBody, tokens, index)
{
	const t0 = tokens[index]
	const t1 = tokens[index+1]
	const t2 = tokens[index+2]

	// Function body ends with "}"
	if (t0.type === TokenType.punctuation && t0.value === '}')
		return index + 1

	// Local declaration
	// int foo;
	if (isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.punctuation && t2.value === ';') {
		makeNode(funcBody, NodeType.localVar, t1.value, dataTypeMap[t0.value], [t0, t1, t2])

		return parseFuncBody(funcBody, tokens, index+3)
	}

	return parseForm(funcBody, tokens, index)
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
	const t0 = tokens[index]
	const t1 = tokens[index+1]
	const t2 = tokens[index+2]
	const t3 = tokens[index+3]

	// Form ends with "}"
	if (t0.type === TokenType.punctuation && t0.value === '}')
		return index + 1

	// Function return
	// return expression;
	if (t0.type === TokenType.keyword && t0.value === 'return') {
		const returnNode = makeNode(parentNode, NodeType.return, parentNode.value, parentNode.dataType, [t0])

		index = parseExpression(returnNode, tokens, index+1)

		const tokenCloseBody = tokens[index]
		if (tokenCloseBody.type === TokenType.punctuation && tokenCloseBody.value === '}')
			return index+1

		throw new Error('Found symbols after function return: ' + tokenCloseBody.value)
	}

	// branch;
	if (t0.type === TokenType.word && t0.value === 'branch' &&
		t1.type === TokenType.punctuation && t1.value === ';') {
		makeNode(parentNode, NodeType.branch, 0, DataType.na, [t0])

		return parseForm(parentNode, tokens, index+2)
	}

	// branch name|index;
	if (t0.type === TokenType.word && t0.value === 'branch' &&
		(t1.type === TokenType.word || t1.type === TokenType.number) &&
		t2.type === TokenType.punctuation && t2.value === ';') {
		makeNode(parentNode, NodeType.branch, t1.value, DataType.na, [t0, t1])

		return parseForm(parentNode, tokens, index+3)
	}

	// branch if (expression);
	if (t0.type === TokenType.word && t0.value === 'branch' &&
		t1.type === TokenType.keyword && t1.value === 'if'     &&
		t2.type === TokenType.punctuation && t2.value === '(') {
		const branchIfNode  = makeNode(parentNode, NodeType.branchIf, 0, DataType.na, [t0, t1])
		const predicateNode = makeNode(branchIfNode, NodeType.predicate, '', DataType.i32)
		index = parseExpression(predicateNode, tokens, index+3)

		return parseForm(parentNode, tokens, index+1)
	}

	// branch name|index if (expression);
	if (t0.type === TokenType.word && t0.value === 'branch' &&
		(t1.type === TokenType.word || t1.type === TokenType.number) &&
		t2.type === TokenType.keyword && t2.value === 'if'     &&
		t3.type === TokenType.punctuation && t3.value === '(') {
		const branchIfNode  = makeNode(parentNode, NodeType.branchIf, t1.value, DataType.na, [t0, t1, t2])
		const predicateNode = makeNode(branchIfNode, NodeType.predicate, '', DataType.i32)
		index = parseExpression(predicateNode, tokens, index+4)

		return parseForm(parentNode, tokens, index+1)
	}

	// loop {
	if (t0.type === TokenType.word && t0.value === 'loop' &&
		t1.type === TokenType.punctuation && t1.value === '{') {
		const loopNode = makeNode(parentNode, NodeType.loop, '', DataType.na, [t0, t1])
		index = parseForm(loopNode, tokens, index+2)

		return parseForm(parentNode, tokens, index)
	}

	// loop name {
	if (t0.type === TokenType.word && t0.value === 'loop' &&
		t1.type === TokenType.word &&
		t2.type === TokenType.punctuation && t2.value === '{') {
		const loopNode = makeNode(parentNode, NodeType.loop, t1.value, DataType.na, [t0, t1])
		index = parseForm(loopNode, tokens, index+3)

		return parseForm(parentNode, tokens, index)
	}

	// block {
	if (t0.type === TokenType.word && t0.value === 'block' &&
		t1.type === TokenType.punctuation && t1.value === '{') {
		const blockNode = makeNode(parentNode, NodeType.block, '', DataType.na, [t0, t1])
		index = parseForm(blockNode, tokens, index+2)

		return parseForm(parentNode, tokens, index)
	}

	// block name {
	if (t0.type === TokenType.word && t0.value === 'block' &&
		t1.type === TokenType.word &&
		t2.type === TokenType.punctuation && t2.value === '{') {
		const blockNode = makeNode(parentNode, NodeType.block, t1.value, DataType.na, [t0, t1])
		index = parseForm(blockNode, tokens, index+3)

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

		const assignmentNode = makeNode(parentNode, NodeType.assignment, varNode.value, varNode.dataType, [t0, t1])
		assignmentNode.nodes.push(varNode)
		index = parseExpression(assignmentNode, tokens, index+2)

		return parseForm(parentNode, tokens, index)
	}

	// if (expression) { FORM }
	// if (expression) { FORM } else { FORM }
	if (t0.type === TokenType.keyword && t0.value === 'if' &&
		t1.type === TokenType.punctuation && t1.value === '(') {

		const ifNode = makeNode(parentNode, NodeType.if, '', DataType.na, [t0, t1])

		const predicate = makeNode(ifNode, NodeType.predicate, '', DataType.i32, [t2])
		index = parseExpression(predicate, tokens, index+2)

		const then = makeNode(ifNode, NodeType.then, '', DataType.na, [tokens[index]])
		index = parseForm(then, tokens, index+1)

		if (tokens[index].type === TokenType.keyword && tokens[index].value === 'else') {
			const elseNode = makeNode(ifNode, NodeType.else, '', DataType.na, [tokens[index]])
			index = parseForm(elseNode, tokens, index+2)
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
	const t0 = tokens[index]

	if (t0.type === TokenType.punctuation && [';', ',', ')'].includes(t0.value))
		return index + 1

	// Open parenthesis
	if (t0.type === TokenType.punctuation && t0.value === '(') {
		const expressionNode = makeNode(parentNode, NodeType.expression, '', parentNode.dataType, [t0])
		return parseExpression(expressionNode, tokens, index+1)
	}

	// Number
	// 42 | 3.14
	if (t0.type === TokenType.number) {
		const value = parentNode.dataType === DataType.i32 || parentNode.dataType === DataType.i64
			? parseInt(t0.value)
			: parseFloat(t0.value)

		makeNode(parentNode, NodeType.number, value, parentNode.dataType, [t0])

		return parseExpression(parentNode, tokens, index+1)
	}

	// Variable lookup
	// foo
	if (t0.type === TokenType.word) {
		const variableNode = lookupVar(parentNode, t0.value)
		if (variableNode === null)
			throw new Error('Cannot find a variable: ' + t0.value)
		parentNode.nodes.push(variableNode)

		return parseExpression(parentNode, tokens, index+1)
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

/**
 * Stringifies AST
 *
 * @param {Node} node
 *
 * @return {string}
 */
function stringifyAst(node)
{
	const output = []
	loopAst(node, 0, output)

	return output.join('\n')

	/**
	 * @param {Node}     node
	 * @param {number}   level
	 * @param {string[]} output
	 */
	function loopAst(node, level, output)
	{
		const leftPad      = '    '.repeat(level)
		const dataTypeText = node.dataType !== DataType.na ? ': ' + node.dataType : ''
		const valueText    = node.value === '' ? '' : ' ' + String(node.value)
		const nodeText     = `${leftPad}${node.type}${valueText}${dataTypeText}`

		output.push(nodeText)

		for (const nd of node.nodes) {
			loopAst(nd, level+1, output)
		}
	}
}

module.exports = {
	parse,
	stringifyAst,
	NodeType,
	DataType,
}
