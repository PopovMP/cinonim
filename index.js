'use strict'

/**
 * @typedef {Object} Token
 *
 * @property {number}    line
 * @property {number}    column
 * @property {TokenType} type
 * @property {string}    value
 */

/**
 * @typedef {Object} Node
 *
 * @property {NodeType}   type
 * @property {*}          value    - value
 * @property {string}     dataType - na, i32, i64, f32, f64, void
 * @property {Node[]}     nodes    - list of underlying nodes
 * @property {Token|null} token
 * @property {Node|null}  parent
 * @property {string[]}   [data]
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

/**
 * NodeType
 * @enum {string}
 */
const NodeType = {
	break        : 'break',
	condition    : 'condition',
	continue     : 'continue',
	do           : 'do',
	else         : 'else',
	exportFunc   : 'exportFunc',
	expression   : 'expression',
	for          : 'for',
	funcBody     : 'funcBody',
	funcParams   : 'funcParams',
	function     : 'function',
	functionCall : 'functionCall',
	globalConst  : 'globalConst',
	globalGet    : 'globalGet',
	globalVar    : 'globalVar',
	globalSet    : 'globalSet',
	if           : 'if',
	localConst   : 'localConst',
	localGet     : 'localGet',
	localVar     : 'localVar',
	localSet     : 'localSet',
	loopBody     : 'loopBody',
	module       : 'module',
	number       : 'number',
	importFunc   : 'importFunc',
	operator     : 'operator',
	return       : 'return',
	statement    : 'statement',
	then         : 'then',
	while        : 'while',
}

/**
 * DataType
 * @enum {string}
 */
const DataType = {
	na    : 'na',
	i32   : 'i32',
	i64   : 'i64',
	f32   : 'f32',
	f64   : 'f64',
	void  : 'void',
}

const dataTypeMap = {
	int    : DataType.i32,
	long   : DataType.i64,
	float  : DataType.f32,
	double : DataType.f64,
	void   : DataType.void,
}

// noinspection JSUnusedLocalSymbols
const operatorPrecedence = {
	'('  : 18, ')'  : 18,
	'['  : 17, ']'  : 17, 'funcCall': 17,
	'.++': 15, '.--': 15, // Postfix increment, decrement
	'++.': 14, '--.': 14, // Prefix  increment, decrement
	'-.' : 14, '!'  : 14, // Negate, not
	'**' : 13, '^'  : 13, // Power
	'*'  : 12, '/'  : 12, '%': 12,
	'+'  : 11, '-'  : 11,
	'<'  : 9,  '<=' : 9,  '>': 9, '>=': 9,
	'==' : 8, '!='  : 8,
	'&&' : 4,
	'||' : 3,
	'?:' : 2, // Ternary operator
	','  : 1, // Comma sequence
}

/**
 * Makes a new node
 *
 * @param {Node|null}     parent   - parent Node
 * @param {NodeType}      type     - NodeType
 * @param {string|number} value    - variable name, function name, number, ...
 * @param {string}        dataType - DataType
 * @param {Token|null}    [token] - based tokens
 *
 * @return {Node}
 */
function makeNode(parent, type, value, dataType, token= null)
{
	const node = {parent, type, value, dataType, token, nodes: []}

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
	return token.type === TokenType.keyword && [
		'int', 'long', 'float', 'double', 'void'
	].includes(token.value)
}

/**
 * Gets if token is wanted punctuation
 *
 * @param {Token} token
 * @param {string} value
 *
 * @return {boolean}
 */
function isPunct(token, value)
{
	return token.type === TokenType.punctuation && token.value === value
}

/**
 * Gets if token is wanted operator
 *
 * @param {Token} token
 * @param {string} value
 *
 * @return {boolean}
 */
function isOperator(token, value)
{
	return token.type === TokenType.operator && token.value === value
}

/**
 * Gets if token is wanted keyword
 *
 * @param {Token} token
 * @param {string} value
 *
 * @return {boolean}
 */
function isKeyword(token, value)
{
	return token.type === TokenType.keyword && token.value === value
}

/**
 * Gets if token is word
 *
 * @param {Token} token
 *
 * @return {boolean}
 */
function isWord(token)
{
	return token.type === TokenType.word
}

/**
 * Gets if token is a number
 *
 * @param {Token} token
 *
 * @return {boolean}
 */
function isNumber(token)
{
	return token.type === TokenType.number
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

	const t0 = tokens[index]
	const t1 = tokens[index+1]
	const t2 = tokens[index+2]
	const t3 = tokens[index+3]
	const t4 = tokens[index+4]

	// Global variable
	// int foo = 42;
	if ( isDataType(t0) && isWord(t1) && isOperator(t2, '=') ) {
		const globalVar = makeNode(moduleNode, NodeType.globalVar, t1.value, dataTypeMap[t0.value], t0)
		parseNumber(globalVar, t3)

		return parseModule(moduleNode, tokens, index+5)
	}

	// Global constant
	// const int foo = 42;
	if ( isKeyword(t0, 'const') && isDataType(t1) && isWord(t2) && isOperator(t3, '=') ) {
		const globalConst = makeNode(moduleNode, NodeType.globalConst, t2.value, dataTypeMap[t1.value], t0)
		parseNumber(globalConst, t4)

		return parseModule(moduleNode, tokens, index+6)
	}

	// Function definition
	// int foo(int bar, const int baz) { }
	// function
	//   +-- funcParams
	//   \-- funcBody
	if ( isDataType(t0) && isWord(t1) && isPunct(t2, '(') ) {
		const dataType = dataTypeMap[t0.value]
		const funcName = t1.value

		const funcNode   = makeNode(moduleNode, NodeType.function,   funcName, dataType)
		const funcParams = makeNode(funcNode,   NodeType.funcParams, funcName, DataType.na)
		const funcBody   = makeNode(funcNode,   NodeType.funcBody,   funcName, dataType)

		index = parseFuncParams(funcParams, tokens, index+3)
		index = parseFuncBody(funcBody, tokens, index+1)

		return parseModule(moduleNode, tokens, index)
	}

	// Import function
	// #import-func console log = void logInt(int val)
	if (t0.type === TokenType.pragma && t0.value === 'import-func') {
		const dataType = dataTypeMap[tokens[index+4].value]
		const funcName = tokens[index+5].value

		const importFunc = makeNode(moduleNode, NodeType.importFunc, funcName, dataType, t0)
		importFunc.data = [t1.value, t2.value]
		const funcParams = makeNode(importFunc, NodeType.funcParams, '', DataType.na)

		index = parseFuncParams(funcParams, tokens, index+7)

		return parseModule(moduleNode, tokens, index)
	}

	// Export function
	// #export-func foo = myFoo
	if (t0.type === TokenType.pragma && t0.value === 'export-func') {
		const funcName = tokens[index+3].value

		const exportFunc = makeNode(moduleNode, NodeType.exportFunc, funcName, DataType.na, t0)
		exportFunc.data = [t1.value]

		return parseModule(moduleNode, tokens, index+4)
	}

	throw new Error(`[${t0.line+1}, ${t0.column+1}] Unrecognised symbol in module:  ${t0.value}`)
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
		const t2 = tokens[index+2]

		if ( isPunct(t0, ')') ) break
		if ( isPunct(t0, ',') ) continue

		if ( isKeyword(t0, 'const') ) {
			makeNode(funcParams, NodeType.localConst, t2.value, dataTypeMap[t1.value], t0)
			index += 2
		}
		else {
			makeNode(funcParams, NodeType.localVar, t1.value, dataTypeMap[t0.value], t0)
			index += 1
		}
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

	if ( isPunct(t0, '}') )
		return index + 1

	// Local declaration
	// int foo;
	if ( isDataType(t0) && isWord(t1) ) {
		do {
			index += 1
			const tk = tokens[index]
			makeNode(funcBody, NodeType.localVar, tk.value, dataTypeMap[t0.value], tk)
			index += 1
		} while (tokens[index].value === ',')

		return parseFuncBody(funcBody, tokens, index+1)
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

	if ( isPunct(t0, '}') ) return index+1

	// Function return
	// return expression;
	if ( isKeyword(t0, 'return') ) {
		const returnNode = makeNode(parentNode, NodeType.return, parentNode.value, parentNode.dataType, t0)
		if ( isPunct(t1, ';') )
			return index+1

		index = parseExpression(returnNode, tokens, index+1)

		const tk = tokens[index]
		if ( isPunct(tk, '}') )
			return index+1

		throw new Error(`[${tk.line+1}, ${tk.column+1}] Found symbols after function return: ${tk.value}`)
	}

	// break    index?;
	// continue index?;
	if ( isKeyword(t0, 'break') || isKeyword(t0, 'continue') ) {
		const command = t0.value === 'break' ? NodeType.break : NodeType.continue

		if ( isPunct(t1, ';') )
			makeNode(parentNode, command, 0, DataType.na, t0)
		else if ( isNumber(t1) && isPunct(t2, ';') )
			makeNode(parentNode, command, t1.value, DataType.na, t0)
		else
			throw new Error(`[${t1.line+1}, ${t1.column+1}] Wrong symbol in "${t0.value}", Expected ";" or an index but got: ${t1.value}`)

		return parseForm(parentNode, tokens, index+2)
	}

	// for (assignment; condition; assignment) { FORM }
	// for
	//    +-- statement
	//    +-- condition
	//    +-- statement
	//    \-- loopBody
	if ( isKeyword(t0, 'for') ) {
		const forNode  = makeNode(parentNode, NodeType.for,       '', DataType.na, t0)
		const initNode = makeNode(forNode,    NodeType.statement, '', DataType.na, t2)

		if ( isPunct(t2, ';') )
			index += 3
		else
			index = parseAssignment(initNode, tokens, index+2)

		const tk = tokens[index]
		const condition = makeNode(forNode, NodeType.condition, '', DataType.i32, tk)

		if ( isPunct(tk, ';') )
			index += 1
		else
			index = parseExpression(condition, tokens, index)

		const tk1 = tokens[index]
		const increment = makeNode(forNode, NodeType.statement, '', DataType.na,  tk1)

		if ( isPunct(tk1, ')') )
			index += 1
		else
			index = parseAssignment(increment, tokens, index)

		const loopBody = makeNode(forNode, NodeType.loopBody, '', DataType.na, tokens[index])
		index = parseForm(loopBody, tokens, index+1)

		return parseForm(parentNode, tokens, index)
	}

	// do { FORM } while (condition);
	// do
	//    +-- loopBody
	//    \-- condition
	if ( isKeyword(t0, 'do') ) {
		if (! isPunct(t1, '{') )
			throw new Error(`[${t1.line+1}, ${t1.column+1}] Wrong symbol in "do". Expected "{" but got: ${t1.value}`)

		const doNode   = makeNode(parentNode, NodeType.do,       '', DataType.na, t0)
		const loopBody = makeNode(doNode,     NodeType.loopBody, '', DataType.na, t2)

		index = parseForm(loopBody, tokens, index+2)

		const tk0 = tokens[index]
		if (! isKeyword(tk0, 'while') )
			throw new Error(`[${tk0.line+1}, ${tk0.column+1}] Wrong symbol in "do". Expected "while" but got: ${tk0.value}`)

		const tk1 = tokens[index+1]
		if (! isPunct(tk1, '(') )
			throw new Error(`[${tk1.line+1}, ${tk1.column+1}] Wrong symbol in "do". Expected "(" but got: ${tk1.value}`)

		index += 2
		const condition = makeNode(doNode, NodeType.condition, '', DataType.i32, tokens[index])
		index = parseExpression(condition, tokens, index)

		return parseForm(parentNode, tokens, index+1)
	}

	// while (condition) { FORM }
	// while
	//    +-- condition
	//    \-- loopBody
	if ( isKeyword(t0, 'while') ) {
		if (! isPunct(t1, '(') )
			throw new Error(`[${t1.line+1}, ${t1.column+1}] Wrong symbol in "while". Expected "(" but got: ${t1.value}`)

		const whileNode = makeNode(parentNode, NodeType.while,     '', DataType.na,  t0)
		const condition = makeNode(whileNode,  NodeType.condition, '', DataType.i32, t2)

		index = parseExpression(condition, tokens, index+2)

		const tk0 = tokens[index]
		if (! isPunct(tk0, '{') )
			throw new Error(`[${tk0.line+1}, ${tk0.column+1}] Wrong symbol in "while". Expected "{" but got: ${tk0.value}`)

		const loopBody = makeNode(whileNode, NodeType.loopBody, '', DataType.na, tk0)

		index = parseForm(loopBody, tokens, index+1)

		return parseForm(parentNode, tokens, index)
	}

	// if (condition) { FORM }
	// if (condition) { FORM } else { FORM }
	// if
	//    +-- condition
	//    +-- then
	//    \-- else
	if ( isKeyword(t0, 'if') ) {
		if (! isPunct(t1, '(') )
			throw new Error(`[${t1.line+1}, ${t1.column+1}] Wrong symbol in "if". Expected "(" but got: ${t1.value}`)

		const ifNode    = makeNode(parentNode, NodeType.if,        '', DataType.na,  t0)
		const condition = makeNode(ifNode,     NodeType.condition, '', DataType.i32, t2)
		index = parseExpression(condition, tokens, index+2)

		const tk0 = tokens[index]
		if (! isPunct(tk0, '{') )
			throw new Error(`[${tk0.line+1}, ${tk0.column+1}] Wrong symbol in "if". Expected "{" but got: ${tk0.value}`)

		const thenNode = makeNode(ifNode, NodeType.then, '', DataType.na, tokens[index])
		index = parseForm(thenNode, tokens, index+1)

		const tk1 = tokens[index]
		if ( isKeyword(tk1, 'else') ) {
			const elseNode = makeNode(ifNode, NodeType.else, '', DataType.na, tk1)

			const tk2 = tokens[index+1]
			if (! isPunct(tk2, '{') )
				throw new Error(`[${tk2.line+1}, ${tk2.column+1}] Wrong symbol in "else". Expected "{" but got: ${tk2.value}`)

			index = parseForm(elseNode, tokens, index+2)
		}

		return parseForm(parentNode, tokens, index)
	}

	// Assignment
	// foo = expression;
	if ( isWord(t0) ) {
		if (! isOperator(t1, '=') )
			throw new Error(`[${t1.line+1}, ${t1.column+1}] Wrong symbol in assignment. Expected "=" but got: ${t1.value}`)

		index = parseAssignment(parentNode, tokens, index)

		return parseForm(parentNode, tokens, index)
	}

	throw new Error(`[${t0.line+1}, ${t0.column+1}] Unrecognised symbol in ${parentNode.type}:  ${t0.value}`)
}

/**
 * Parses a variable assignment
 *
 * foo = expression; // Statement in FORM
 * foo = expression) // increment part of `for` loop
 * The terminal punctuation is determined (and consumed) by `parseExpression`
 *
 * @param {Node}    parentNode
 * @param {Token[]} tokens
 * @param {number}  index
 *
 * @return {number} - the index of the terminal punctuation
 */
function parseAssignment(parentNode, tokens, index)
{
	const t0 = tokens[index]
	if (! isWord(t0) )
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Wrong symbol in assignment. Expected a variable name but got: ${t0.value}`)

	const varName = t0.value
	const varNode = lookup(parentNode, varName)
	if (varNode === null)
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Cannot find a variable:  ${varName}`)
	if (varNode.type === NodeType.localConst || varNode.type === NodeType.globalConst)
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Cannot assign value to a constant:  ${varName}`)

	const nodeType = varNode.type === NodeType.globalVar ? NodeType.globalSet : NodeType.localSet
	const varSet   = makeNode(parentNode, nodeType, varNode.value, varNode.dataType, t0)

	index = parseExpression(varSet, tokens, index+2)

	if ( isPunct(tokens[index-1], ',') )
		return parseAssignment(parentNode, tokens, index)

	return index
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
	const exprNode = parentNode.type === NodeType.expression
				? parentNode
				: makeNode(parentNode, NodeType.expression, '', parentNode.dataType, t0)

	index = parseExpressionChain(exprNode, tokens, index)

	loopPrecedence(parentNode)

	return index
}

/**
 * Gets the type of the next node
 *
 * @param {Node}     parentNode
 * @param {Token[]}  tokens
 * @param {number}   index
 *
 * @return {number} the index of the terminal token
 */
function parseExpressionChain(parentNode, tokens, index)
{
	const t0 = tokens[index]
	const t1 = tokens[index+1]

	if ( isPunct(t0, ';') || isPunct(t0, ',') || isPunct(t0, ')') ) return index+1

	// Open parenthesis
	if ( isPunct(t0, '(') ) {
		const openParen = makeNode(parentNode, NodeType.expression, '', parentNode.dataType, t0)
		index = parseExpression(openParen, tokens, index+1)
		return parseExpressionChain(parentNode, tokens, index)
	}

	// Number
	// 42 | 3.14F
	if ( isNumber(t0) ) {
		parseNumber(parentNode, t0)
		return parseExpressionChain(parentNode, tokens, index+1)
	}

	// Operator
	// +, -, ^, ...
	if (t0.type === TokenType.operator) {
		makeNode(parentNode, NodeType.operator, t0.value, parentNode.dataType, t0)
		return parseExpressionChain(parentNode, tokens, index+1)
	}

	// Function call
	// foo(bar, ...)
	if ( isWord(t0) && isPunct(t1, '(') ) {
		const funcName = t0.value
		const funcNode = lookup(parentNode, funcName)

		if (funcNode === null || funcNode.type !== NodeType.function)
			throw new Error(`[${t0.line+1}, ${t0.column+1}] Cannot find a function: ${funcName}`)

		const funcCall = makeNode(parentNode, NodeType.functionCall, t0.value, funcNode.dataType, t0)
		index += 2

		// Void call
		if ( isPunct(t1, ')') )
			return parseExpressionChain(parentNode, tokens, index)

		do {
			index = parseExpression(funcCall, tokens, index)
		} while( isPunct(tokens[index-1], ',') )

		return parseExpressionChain(parentNode, tokens, index)
	}

	// Variable lookup
	// foo
	if ( isWord(t0) ) {
		const varNode = lookup(parentNode, t0.value)
		if (varNode === null)
			throw new Error(`[${t0.line+1}, ${t0.column+1}] Cannot find a variable:  ${t0.value}`)

		const nodeType = varNode.type === NodeType.globalVar || varNode.type === NodeType.globalConst
			? NodeType.globalGet
			: NodeType.localGet

		makeNode(parentNode, nodeType, varNode.value, varNode.dataType, t0)
		return parseExpressionChain(parentNode, tokens, index+1)
	}

	throw new Error(`[${t0.line+1}, ${t0.column+1}] Unrecognised symbol in ${parentNode.type}:  ${t0.value}`)
}

/**
 * Parses a number
 *
 * @param {Node} parentNode
 * @param {Token} token
 *
 */
function parseNumber(parentNode, token)
{
	const sfxMatch = token.value.match(/([LFD])$/)
	const suffix   = sfxMatch ? sfxMatch[1] : ''
	const decPoint = token.value.includes('.')

	switch (suffix) {
		case 'L': {
			if (decPoint)
				throw new Error(`[${token.line+1}, ${token.column+1}] Wrong number suffix L in:  ${token.value}`)
			if (parentNode.dataType !== DataType.i64)
				throw new Error(`[${token.line+1}, ${token.column+1}] Wrong data type. Expected ${parentNode.dataType}, but got i64: ${token.value}`)
			makeNode(parentNode, NodeType.number, parseInt(token.value), DataType.i64, token)
			break
		}
		case 'F': {
			if (token.value.length > 8)
				throw new Error(`[${token.line+1}, ${token.column+1}] Losing precision in:  ${token.value}`)
			if (parentNode.dataType !== DataType.f32)
				throw new Error(`[${token.line+1}, ${token.column+1}] Wrong data type. Expected ${parentNode.dataType}, but got f32: ${token.value}`)
			makeNode(parentNode, NodeType.number, parseFloat(token.value), DataType.f32, token)
			break
		}
		case 'D': {
			if (parentNode.dataType !== DataType.f64)
				throw new Error(`[${token.line+1}, ${token.column+1}] Wrong data type. Expected ${parentNode.dataType}, but got f64: ${token.value}`)
			makeNode(parentNode, NodeType.number, parseFloat(token.value), DataType.f64, token)
			break
		}
		default: {
			if (decPoint) {
				if (token.value.length > 8 || parentNode.dataType === DataType.f64) {
					if (parentNode.dataType !== DataType.f64)
						throw new Error(`[${token.line+1}, ${token.column+1}] Wrong data type. Expected ${parentNode.dataType}, but got f64: ${token.value}`)
					makeNode(parentNode, NodeType.number, parseFloat(token.value), DataType.f64, token)
				}
				else {
					if (parentNode.dataType !== DataType.f32)
						throw new Error(`[${token.line+1}, ${token.column+1}] Wrong data type. Expected ${parentNode.dataType}, but got f32: ${token.value}`)
					makeNode(parentNode, NodeType.number, parseFloat(token.value), DataType.f32, token)
				}
			}
			else {
				makeNode(parentNode, NodeType.number, parseInt(token.value), parentNode.dataType, token)
			}
		}
	}
}

/**
 * Searches a variable within current or the parent nodes.
 *
 * @param {Node|null} parentNode
 * @param {string}    varName
 *
 * @return {Node|null}
 */
function lookup(parentNode, varName)
{
	if (parentNode === null) return null

	/** @type {NodeType[]} */
	const variableTypes = [
		NodeType.localVar,  NodeType.localConst,
		NodeType.globalVar, NodeType.globalConst,
		NodeType.function
	]

	for (const node of parentNode.nodes) {
		if (variableTypes.includes(node.type) && node.value === varName)
			return node

		// Function parameter
		if (node.type === NodeType.funcParams) {
			for (const param of node.nodes) {
				if (param.value === varName)
					return param
			}
		}
	}

	return lookup(parentNode.parent, varName)
}

function loopPrecedence(node)
{
	for (let i = 0; i < node.nodes.length; i++) {
		const expr = node.nodes[i]
		if (expr.type === NodeType.expression) {
			const exprChain = solveOperatorPrecedence(expr)
			if (exprChain.length === 1) {
				const expVal = exprChain[0]
				expVal.parent = node
				node.nodes[i] = expVal
			}
			else {
				expr.nodes = exprChain
			}
		}

		loopPrecedence(node.nodes[i])
	}
}

/**
 * @param {Node} exprNode
 *
 * @return {Node[]}
 */
function solveOperatorPrecedence(exprNode)
{
	const operatorStack = []
	const exprChain     = []

	for (let i = 0; i < exprNode.nodes.length; i += 1) {
		const curr = exprNode.nodes[i]
		if ( isOperandNode(curr) ) {
			exprChain.push(curr)
		}
		else {
			if (operatorStack.length === 0)	{
				operatorStack.push(curr)
			}
			else {
				while (operatorStack.length > 0 && !isHigherPrecedence(curr, operatorStack[operatorStack.length-1]) ) {
					exprChain.push( operatorStack.pop() )
				}
				operatorStack.push(curr)
			}
		}
	}

	while (operatorStack.length > 0) {
		exprChain.push( operatorStack.pop() )
	}

	return exprChain
}

/**
 * Gets is a node operand
 *
 * @param {Node} node
 *
 * @return {boolean}
 */
function isOperandNode(node)
{
	return [
		NodeType.number,
		NodeType.expression,
		NodeType.functionCall,
		NodeType.localGet,
		NodeType.globalGet,
	].includes(node.type)
}

/**
 * @param {Node} opA
 * @param {Node} opB
 *
 * @return {boolean}
 */
function isHigherPrecedence(opA, opB)
{
	if (opA.type !== NodeType.operator || !operatorPrecedence.hasOwnProperty(opA.value)) {
		const t0 = opA.token
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Unrecognised operator in ${opA.parent.value}:  ${opA.value}`)
	}

	if (opB.type !== NodeType.operator || !operatorPrecedence.hasOwnProperty(opB.value)) {
		const t0 = opB.token
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Unrecognised operator in ${opB.parent.value}:  ${opB.value}`)
	}

	return operatorPrecedence[opA.value] > operatorPrecedence[opB.value]
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
