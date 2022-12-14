'use strict'

const {DataType, NodeType, OperatorPrecedence, TokenType, Keyword} = require('./def')

const dataTypeMap = {
	int    : DataType.i32,
	long   : DataType.i64,
	float  : DataType.f32,
	double : DataType.f64,
	void   : DataType.void,
}

/** @type {NodeType[]} */
const variableTypes = [
	NodeType.localVar,  NodeType.localConst,
	NodeType.globalVar, NodeType.globalConst,
	NodeType.function,  NodeType.importFunc,
	NodeType.arrayAlloc,
]

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
function isPunctuation(token, value)
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
 * @param {Token  } token
 * @param {Keyword} keyword
 *
 * @return {boolean}
 */
function isKeyword(token, keyword)
{
	return token.type === TokenType.keyword && token.value === keyword
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

	// Global variable
	// int foo = 42;
	if (isDataType(t0) && isWord(t1) && isOperator(t2, '=')) {
		const globalVar = makeNode(moduleNode, NodeType.globalVar, t1.value, dataTypeMap[t0.value], t0)
		index = parseExpressionChain(globalVar, tokens, index+3)

		return parseModule(moduleNode, tokens, index)
	}

	// Global constant
	// const int foo = 42;
	if (isKeyword(t0, Keyword.const) && isDataType(t1) && isWord(t2) && isOperator(t3, '=')) {
		const globalConst = makeNode(moduleNode, NodeType.globalConst, t2.value, dataTypeMap[t1.value], t0)
		index = parseExpressionChain(globalConst, tokens, index+4)

		return parseModule(moduleNode, tokens, index)
	}

	// Array allocation
	// int foo[42];
	if (isDataType(t0) && isWord(t1) && isPunctuation(t2, '[')) {
		const arrDataType = dataTypeMap[t0.value]
		const arrName     = t1.value
		const arrLength   = parseInt(t3.value)
		const arrayAlloc  = makeNode(moduleNode, NodeType.arrayAlloc, arrName, arrDataType, t0)
		arrayAlloc.data = [arrLength]

		return parseModule(moduleNode, tokens, index+6)
	}

	// Function definition
	// int foo(int bar, const int baz) { }
	// function
	//   +-- funcParams
	//   \-- funcBody
	if (isDataType(t0) && isWord(t1) && isPunctuation(t2, '(')) {
		const dataType = dataTypeMap[t0.value]
		const funcName = t1.value

		const funcNode   = makeNode(moduleNode, NodeType.function,   funcName, dataType)
		const funcParams = makeNode(funcNode,   NodeType.funcParams, '', DataType.na)
		const funcBody   = makeNode(funcNode,   NodeType.funcBody,   '', dataType)

		index = parseFuncParams(funcParams, tokens, index+3)
		index = parseBlock(funcBody, tokens, index)

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
 * @return {number} - index of the next token
 */
function parseFuncParams(funcParams, tokens, index)
{
	for (;;index += 1) {
		const t0 = tokens[index]
		const t1 = tokens[index+1]
		const t2 = tokens[index+2]

		if (isPunctuation(t0, ')')) break
		if (isPunctuation(t0, ',')) continue

		if (isKeyword(t0, Keyword.const)) {
			makeNode(funcParams, NodeType.localConst, t2.value, dataTypeMap[t1.value], t0)
			index += 2
		}
		else {
			makeNode(funcParams, NodeType.localVar, t1.value, dataTypeMap[t0.value], t0)
			index += 1
		}
	}

	return index+1
}

/**
 * Parses a single statement or a block of multiple statements.
 * A block starts with "{" and ends with "}".
 *
 * @param {Node}    parentNode
 * @param {Token[]} tokens
 * @param {number}  index - index of the first token to parse
 *
 * @return {number} - index of the next token
 */
function parseBlock(parentNode, tokens, index)
{
	const t0 = tokens[index]

	// Parse a block of code
	if (isPunctuation(t0, '{')) {
		index += 1

		while (! isPunctuation(tokens[index], '}'))
			index = parseStatement(parentNode, tokens, index)

		return index+1
	}

	// Parse a single statement
	return parseStatement(parentNode, tokens, index)
}

/**
 * Parses a single statement
 *
 * @param {Node}    parentNode
 * @param {Token[]} tokens
 * @param {number}  index - index of the first token to parse
 *
 * @return {number} - index of the next token
 */
function parseStatement(parentNode, tokens, index)
{
	const t0 = tokens[index]
	const t1 = tokens[index+1]
	const t2 = tokens[index+2]

	// Local declaration
	// int foo;
	if (isDataType(t0) && isWord(t1) ) {
		const dataType = dataTypeMap[t0.value]
		do {
			// Check if the declaration is directly in a function body
			if (parentNode.type !== NodeType.funcBody)
				throw new Error(`[${t1.line+1}, ${t1.column+1}] Local variables must be declared directly in a function body: ${t1.value}`)

			// Check if the declaration is in the beginning of the function body
			const prevChildNode = parentNode.nodes[parentNode.nodes.length-1]
			if (prevChildNode !== undefined && prevChildNode.type !== NodeType.localVar)
				throw new Error(`[${t1.line+1}, ${t1.column+1}] Local variables must be declared in the beginning of a function body: ${t1.value}`)

			const varToken = tokens[index+1]
			const varName  = varToken.value
			makeNode(parentNode, NodeType.localVar, varName, dataType, varToken)
			index += 2
		} while (isPunctuation(tokens[index], ','))

		return index+1
	}

	// return expression?;
	// return
	//    \-- expression
	if (isKeyword(t0, Keyword.return)) {
		const funcNode   = findNearestNode(parentNode, NodeType.function)
		const returnNode = makeNode(parentNode, NodeType.return, '', funcNode.dataType, t0)

		if (isPunctuation(t1, ';'))
			index += 2
		else
			index = parseExpression(returnNode, tokens, index+1)

		return index
	}

	// break    index?;
	// continue index?;
	if (isKeyword(t0, Keyword.break) || isKeyword(t0, Keyword.continue)) {
		const command = t0.value === 'break' ? NodeType.break : NodeType.continue
		const target  = t0.value === 'break' ? 1 : 0

		if (isPunctuation(t1, ';')) {
			makeNode(parentNode, command, target, DataType.na, t0)
			index += 2
		}
		else if (isNumber(t1) && isPunctuation(t2, ';')) {
			makeNode(parentNode, command, Number(t1.value) + target, DataType.na, t0)
			index += 3
		}
		else {
			throw new Error(`[${t1.line + 1}, ${t1.column + 1}] Wrong symbol in "${t0.value}", Expected ";" or an index but got: ${t1.value}`)
		}

		return index
	}

	// for (assignment; condition; assignment) <block of statements>
	// for
	//    +-- statement
	//    +-- condition
	//    +-- statement
	//    \-- loopBody
	if (isKeyword(t0, Keyword.for)) {
		const forNode  = makeNode(parentNode, NodeType.for,       '', DataType.na, t0)
		const initNode = makeNode(forNode,    NodeType.statement, '', DataType.na, t2)

		if (isPunctuation(t2, ';'))
			index += 3
		else
			index = parseAssignment(initNode, tokens, index+2)

		const tk = tokens[index]
		const condition = makeNode(forNode, NodeType.condition, '', DataType.i32, tk)

		if (isPunctuation(tk, ';'))
			index += 1
		else
			index = parseExpression(condition, tokens, index)

		const tk1 = tokens[index]
		const increment = makeNode(forNode, NodeType.statement, '', DataType.na,  tk1)

		if (isPunctuation(tk1, ')'))
			index += 1
		else
			index = parseAssignment(increment, tokens, index)

		const loopBody = makeNode(forNode, NodeType.loopBody, '', DataType.na, tokens[index])

		return parseBlock(loopBody, tokens, index)
	}

	// do { statement* } while (condition);
	// do
	//    +-- loopBody
	//    \-- condition
	if (isKeyword(t0, Keyword.do)) {
		if (! isPunctuation(t1, '{'))
			throw new Error(`[${t1.line+1}, ${t1.column+1}] Wrong symbol in "do". Expected "{" but got: ${t1.value}`)

		const doNode   = makeNode(parentNode, NodeType.do,       '', DataType.na, t0)
		const loopBody = makeNode(doNode,     NodeType.loopBody, '', DataType.na, t2)

		index = parseBlock(loopBody, tokens, index+1)

		const tk0 = tokens[index]
		if (! isKeyword(tk0, Keyword.while))
			throw new Error(`[${tk0.line+1}, ${tk0.column+1}] Wrong symbol in "do". Expected "while" but got: ${tk0.value}`)

		const tk1 = tokens[index+1]
		if (! isPunctuation(tk1, '('))
			throw new Error(`[${tk1.line+1}, ${tk1.column+1}] Wrong symbol in "do". Expected "(" but got: ${tk1.value}`)

		index += 2
		const condition = makeNode(doNode, NodeType.condition, '', DataType.i32, tokens[index])

		index = parseExpression(condition, tokens, index)

		return index+1 // Eats last ";"
	}

	// while (condition) <block of statements>
	// while
	//    +-- condition
	//    \-- loopBody
	if (isKeyword(t0, Keyword.while)) {
		if (! isPunctuation(t1, '('))
			throw new Error(`[${t1.line+1}, ${t1.column+1}] Wrong symbol in "while". Expected "(" but got: ${t1.value}`)

		const whileNode = makeNode(parentNode, NodeType.while,     '', DataType.na,  t0)
		const condition = makeNode(whileNode,  NodeType.condition, '', DataType.i32, t2)

		index = parseExpression(condition, tokens, index+2)
		const loopBody = makeNode(whileNode, NodeType.loopBody, '', DataType.na, tokens[index])

		return parseBlock(loopBody, tokens, index)
	}

	// if (condition) <block of statements>
	// if (condition) <block of statements> else <block of statements>
	// if
	//    +-- condition
	//    +-- then
	//    \-- else
	if (isKeyword(t0, Keyword.if)) {
		if (! isPunctuation(t1, '('))
			throw new Error(`[${t1.line+1}, ${t1.column+1}] Wrong symbol in "if". Expected "(" but got: ${t1.value}`)

		const ifNode    = makeNode(parentNode, NodeType.if,        '', DataType.na,  t0)
		const condition = makeNode(ifNode,     NodeType.condition, '', DataType.i32, t2)
		index = parseExpression(condition, tokens, index+2)

		const thenNode = makeNode(ifNode, NodeType.then, '', DataType.na, tokens[index])
		index = parseBlock(thenNode, tokens, index)

		if (isKeyword(tokens[index], Keyword.else)) {
			const elseNode = makeNode(ifNode, NodeType.else, '', DataType.na, tokens[index])
			index = parseBlock(elseNode, tokens, index+1)
		}

		return index
	}

	// Function call
	// foo(bar, ...);
	if (isWord(t0) && isPunctuation(t1, '(')) {
		index = parseFunctionCall(parentNode, tokens, index)

		return index + 1 // Eats last ";"
	}

	// Array set
	// foo[i] = ...;
	if (isWord(t0) && isPunctuation(t1, '[')) {
		const arrName    = t0.value
		const arrayAlloc = lookup(parentNode, arrName)
		if (arrayAlloc.type !== NodeType.arrayAlloc)
			throw new Error(`[${t0.line+1}, ${t0.column+1}] Cannot find array:  ${arrName}`)

		const arrDataType = arrayAlloc.dataType
		const arraySet    = makeNode(parentNode, NodeType.arraySet, arrName, arrDataType, t0)
		const arrayIndex  = makeNode(arraySet, NodeType.arrayIndex, arrName, DataType.i32, t2)
		index = parseExpression(arrayIndex, tokens, index+2)
		const arrayValue  = makeNode(arraySet, NodeType.arrayValue, arrName, arrDataType, tokens[index+1])
		index = parseExpression(arrayValue,  tokens, index+1)

		return index
	}

	// Assignment
	// foo = expression;
	if (isWord(t0)) {
		if (t1.type === TokenType.operator && ['=', '+=', '-=', '*=', '/=', '%='].includes(t1.value))
			return parseAssignment(parentNode, tokens, index)

		throw new Error(`[${t0.line+1}, ${t0.column+1}] Unrecognised symbol in assignment:  ${t0.value}`)
	}

	throw new Error(`[${t0.line+1}, ${t0.column+1}] Unrecognised symbol in ${parentNode.type}:  ${t0.value}`)
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
	const t2 = tokens[index+2]

	if (isPunctuation(t0, ';') || isPunctuation(t0, ',') ||
		isPunctuation(t0, ')') || isPunctuation(t0, ']')) return index+1

	// Cast
	// (dataType)
	if (isPunctuation(t0, '(') && isDataType(t1) && isPunctuation(t2, ')')) {
		makeNode(parentNode, NodeType.cast, 'cast', dataTypeMap[t1.value], t1)
		return parseExpressionChain(parentNode, tokens, index+3)
	}

	// Open parenthesis
	if (isPunctuation(t0, '(')) {
		const openParen = makeNode(parentNode, NodeType.expression, '', parentNode.dataType, t0)
		index = parseExpression(openParen, tokens, index+1)
		return parseExpressionChain(parentNode, tokens, index)
	}

	// Prefix -
	if (isOperator(t0, '-') && isNumber(t1)) {
		const tPrev = tokens[index-1]
		if (tPrev.type === TokenType.operator || isPunctuation(tPrev, '(') || isKeyword(tPrev, Keyword.return)) {
			if (!isOperator(tPrev, '++') && !isOperator(tPrev, '--')) {
				// Negative number
				t0.value = ''
				t1.value = '-' + t1.value
				parseNumber(parentNode, t1)
				return parseExpressionChain(parentNode, tokens, index+2)
			}
		}
	}

	// Number
	// 42 | 3.14F
	if (isNumber(t0)) {
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
	if (isWord(t0) && isPunctuation(t1, '(')) {
		index = parseFunctionCall(parentNode, tokens, index)
		return parseExpressionChain(parentNode, tokens, index)
	}

	// Array get
	// foo[i]
	if (isWord(t0) && isPunctuation(t1, '[')) {
		const arrName    = t0.value
		const arrayAlloc = lookup(parentNode, arrName)
		if (arrayAlloc.type !== NodeType.arrayAlloc)
			throw new Error(`[${t0.line+1}, ${t0.column+1}] Cannot find array:  ${arrName}`)

		const arrDataType = arrayAlloc.dataType
		const arrayGet    = makeNode(parentNode, NodeType.arrayGet, arrName, arrDataType,  t0)
		const arrayIndex  = makeNode(arrayGet, NodeType.arrayIndex, arrName, DataType.i32, t2)
		index = parseExpression(arrayIndex, tokens, index+2)
		return parseExpressionChain(parentNode, tokens, index)
	}

	// Variable lookup
	// foo
	if (isWord(t0)) {
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
 * Parses a function call
 *
 * @param {Node}    parentNode
 * @param {Token[]} tokens
 * @param {number}  index - index of the first token to parse
 *
 * @return {number} - index of the next token
 */
function parseFunctionCall(parentNode, tokens, index)
{
	const t0 = tokens[index]

	const funcName = t0.value
	const funcNode = lookup(parentNode, funcName)

	if (funcNode === null || (funcNode.type !== NodeType.function && funcNode.type !== NodeType.importFunc))
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Cannot find a function: ${funcName}`)

	const funcCall = makeNode(parentNode, NodeType.functionCall, t0.value, funcNode.dataType, t0)
	index += 2

	if (! isPunctuation(tokens[index], ')')) {
		const funcParams = funcNode.nodes[0]
		for (const param of funcParams.nodes) {
			// Temp assign the data type of the parameter to set the underlying expression properly
			funcCall.dataType = param.dataType
			index = parseExpression(funcCall, tokens, index)
		}
		funcCall.dataType = funcNode.dataType
		return index
	}

	return index + 1;
}

/**
 * Parses a variable assignment
 *
 * foo = expression; // Statement
 * foo = expression) // increment part of `for` loop
 * The terminal punctuation is determined (and consumed) by `parseExpression`
 *
 * @param {Node}    parentNode
 * @param {Token[]} tokens
 * @param {number}  index - index of the first token to parse
 *
 * @return {number} - the index after the parsed tokens
 */
function parseAssignment(parentNode, tokens, index)
{
	const t0 = tokens[index]
	const t1 = tokens[index+1]

	if (! isWord(t0))
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Wrong symbol in assignment. Expected a variable name but got: ${t0.value}`)

	const varName = t0.value
	const varNode = lookup(parentNode, varName)
	if (varNode === null)
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Cannot find a variable:  ${varName}`)
	if (varNode.type === NodeType.localConst || varNode.type === NodeType.globalConst)
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Cannot assign value to a constant:  ${varName}`)

	const nodeType = varNode.type === NodeType.globalVar ? NodeType.globalSet : NodeType.localSet
	const varSet   = makeNode(parentNode, nodeType, varNode.value, varNode.dataType, t0)

	if (isOperator(t1, '=')) {
		index = parseExpression(varSet, tokens, index + 2)
	}
	else if (t1.type === TokenType.operator && ['+=', '-=', '*=', '/=', '%='].includes(t1.value)) {
		const lookupType = varNode.type === NodeType.globalVar ? NodeType.globalGet : NodeType.localGet
		const exprSet    = makeNode(varSet, NodeType.expression, '', varNode.dataType, t1)
		makeNode(exprSet, lookupType, varNode.value, varNode.dataType, varNode.token)
		const rhsExpr = makeNode(exprSet, NodeType.expression, '', varNode.dataType, t1)
		index = parseExpression(rhsExpr, tokens, index + 2)
		makeNode(exprSet, NodeType.operator, t1.value[0], varNode.dataType, t1)
	}

	if (isPunctuation(tokens[index - 1], ','))
		return parseAssignment(parentNode, tokens, index)

	return index
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
 * Finds the nearest node of a given type.
 *
 * @param {Node|null} parentNode
 * @param {NodeType}  nodeType
 *
 * @return {Node|null}
 */
function findNearestNode(parentNode, nodeType)
{
	if (parentNode === null || parentNode.type === nodeType)
		return parentNode

	for (const node of parentNode.nodes) {
		if (variableTypes.includes(node.type) && node.type === nodeType)
			return node

		// Function parameter
		if (node.type === NodeType.funcParams) {
			for (const param of node.nodes) {
				if (node.type === nodeType)
					return param
			}
		}
	}

	return findNearestNode(parentNode.parent, nodeType)
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
		if (isOperandNode(curr)) {
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
		NodeType.arrayGet,
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
	if (opA.type !== NodeType.operator && opA.type !== NodeType.cast) {
		const t0 = opA.token
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Unrecognised operator in ${opA.parent.value}:  ${opA.value}`)
	}

	if (opB.type !== NodeType.operator && opB.type !== NodeType.cast) {
		const t0 = opB.token
		throw new Error(`[${t0.line+1}, ${t0.column+1}] Unrecognised operator in ${opB.parent.value}:  ${opB.value}`)
	}

	return OperatorPrecedence[opA.value] > OperatorPrecedence[opB.value]
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
}
