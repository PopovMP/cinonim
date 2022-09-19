// noinspection GrazieInspection

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
	variable     : 'variable',
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
	number: 'number'
}

/** @type {string[]} */
const dataTypes = ['int', 'long', 'float', 'double', 'void']

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

/** @type {NodeType[]} */
const variableTypes = [
	NodeType.localVar,
	NodeType.localConst,
	NodeType.globalVar,
	NodeType.globalConst,
	NodeType.function
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

	// Global variable
	// int foo = 42;
	if (isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.operator && t2.value === '=') {

		const globalVar = makeNode(moduleNode, NodeType.globalVar, t1.value, dataTypeMap[t0.value], t0)
		parseExpression(globalVar, tokens, index+3)

		return parseModule(moduleNode, tokens, index+5)
	}

	// Global const
	// const int foo = 42;
	if (t0.type === TokenType.keyword && t0.value === 'const' &&
		isDataType(t1) &&
		t2.type === TokenType.word &&
		t3.type === TokenType.operator && t3.value === '=') {

		const globalConst = makeNode(moduleNode, NodeType.globalConst, t2.value, dataTypeMap[t1.value], t0)
		parseExpression(globalConst, tokens, index+4)

		return parseModule(moduleNode, tokens, index+6)
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

	// Function definition
	// int foo(int bar, const int baz) { }
	// function
	//   +-- funcParams
	//   \-- funcBody
	if (isDataType(t0) &&
		t1.type === TokenType.word &&
		t2.type === TokenType.punctuation && t2.value === '(') {

		const dataType = dataTypeMap[t0.value]
		const funcName = t1.value

		const funcNode   = makeNode(moduleNode, NodeType.function,   funcName, dataType)
		const funcParams = makeNode(funcNode,   NodeType.funcParams, funcName, DataType.na)
		const funcBody   = makeNode(funcNode,   NodeType.funcBody,   funcName, dataType)

		index = parseFuncParams(funcParams, tokens, index+3)
		index = parseFuncBody(funcBody, tokens, index+1)

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

		if (t0.type === TokenType.punctuation && t0.value === ')') break
		if (t0.type === TokenType.punctuation && t0.value === ',') continue

		if (t0.type === TokenType.keyword && t0.value === 'const') {
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
	const t2 = tokens[index+2]

	// Function body ends with "}"
	if (t0.type === TokenType.punctuation && t0.value === '}')
		return index + 1

	// Local declaration
	// int foo;
	if (isDataType(t0) &&
		t1.type === TokenType.word) {

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

	// Form ends with "}"
	if (t0.type === TokenType.punctuation && t0.value === '}')
		return index + 1

	// Function return
	// return expression;
	if (t0.type === TokenType.keyword && t0.value === 'return') {
		const returnNode = makeNode(parentNode, NodeType.return, parentNode.value, parentNode.dataType, t0)

		index = parseExpression(returnNode, tokens, index+1)

		const tk = tokens[index]
		if (tk.type === TokenType.punctuation && tk.value === '}')
			return index+1

		throw new Error(`[${tk.line+1}, ${tk.column+1}] Found symbols after function return: ${tk.value}`)
	}

	// break;
	if (t0.type === TokenType.keyword && t0.value === 'break' &&
		t1.type === TokenType.punctuation && t1.value === ';') {
		makeNode(parentNode, NodeType.break, 0, DataType.na, t0)
		return parseForm(parentNode, tokens, index+2)
	}

	// break index;
	if (t0.type === TokenType.keyword && t0.value === 'break' &&
		t1.type === TokenType.number &&
		t2.type === TokenType.punctuation && t2.value === ';') {
		makeNode(parentNode, NodeType.break, t1.value, DataType.na, t0)
		return parseForm(parentNode, tokens, index+3)
	}

	// continue;
	if (t0.type === TokenType.keyword && t0.value === 'continue' &&
		t1.type === TokenType.punctuation && t1.value === ';') {
		makeNode(parentNode, NodeType.continue, 0, DataType.na, t0)
		return parseForm(parentNode, tokens, index+2)
	}

	// continue index;
	if (t0.type === TokenType.keyword && t0.value === 'continue' &&
		t1.type === TokenType.number &&
		t2.type === TokenType.punctuation && t2.value === ';') {
		makeNode(parentNode, NodeType.continue, t1.value, DataType.na, t0)
		return parseForm(parentNode, tokens, index+3)
	}

	// for (assignment; condition; assignment) { FORM }
	// for
	//    +-- statement
	//    +-- condition
	//    +-- statement
	//    \-- loopBody
	if (t0.type === TokenType.keyword && t0.value === 'for') {
		const forNode  = makeNode(parentNode, NodeType.for,    '', DataType.na, t0)

		const initNode = makeNode(forNode, NodeType.statement, '', DataType.na, t2)
		if (t2.type === TokenType.word)
			index = parseAssignment(initNode, tokens, index+2)

		const condition = makeNode(forNode, NodeType.condition, '', DataType.i32, tokens[index])
		if (tokens[index].value !== ';')
			index = parseExpression(condition, tokens, index)

		const increment = makeNode(forNode, NodeType.statement, '', DataType.na,  tokens[index])
		if (tokens[index].value !== ')')
			index = parseAssignment(increment, tokens, index)

		const loopBody = makeNode(forNode, NodeType.loopBody, '', DataType.na, tokens[index])
		index = parseForm(loopBody, tokens, index+1)

		return parseForm(parentNode, tokens, index)
	}

	// do { FORM } while (condition);
	// do
	//    +-- loopBody
	//    \-- condition
	if (t0.type === TokenType.keyword && t0.value === 'do' &&
		t1.type === TokenType.punctuation && t1.value === '{') {

		const doNode = makeNode(parentNode, NodeType.do, '', DataType.na, t0)

		const loopBody = makeNode(doNode, NodeType.loopBody, '', DataType.na, t2)
		index = parseForm(loopBody, tokens, index+2)

		index += 2
		const condition = makeNode(doNode, NodeType.condition, '', DataType.i32, tokens[index])
		index = parseExpression(condition, tokens, index)

		return parseForm(parentNode, tokens, index+1)
	}

	// while (condition) { FORM }
	// while
	//    +-- condition
	//    \-- loopBody
	if (t0.type === TokenType.keyword && t0.value === 'while' &&
		t1.type === TokenType.punctuation && t1.value === '(') {

		const whileNode = makeNode(parentNode, NodeType.while, '', DataType.na, t0)

		const condition = makeNode(whileNode, NodeType.condition, '', DataType.i32, t2)
		index = parseExpression(condition, tokens, index+2)

		index += 1
		const loopBody = makeNode(whileNode, NodeType.loopBody, '', DataType.na, tokens[index])
		index = parseForm(loopBody, tokens, index)

		return parseForm(parentNode, tokens, index)
	}

	// if (condition) { FORM }
	// if (condition) { FORM } else { FORM }
	// if
	//    +-- condition
	//    +-- then
	//    \-- else
	if (t0.type === TokenType.keyword && t0.value === 'if' &&
		t1.type === TokenType.punctuation && t1.value === '(') {

		const ifNode = makeNode(parentNode, NodeType.if, '', DataType.na, t0)

		const condition = makeNode(ifNode, NodeType.condition, '', DataType.i32, t2)
		index = parseExpression(condition, tokens, index+2)

		const thenNode = makeNode(ifNode, NodeType.then, '', DataType.na, tokens[index])
		index = parseForm(thenNode, tokens, index+1)

		if (tokens[index].type === TokenType.keyword && tokens[index].value === 'else') {
			const elseNode = makeNode(ifNode, NodeType.else, '', DataType.na, tokens[index])
			index = parseForm(elseNode, tokens, index+2)
		}

		return parseForm(parentNode, tokens, index)
	}

	// Assignment
	// foo = expression;
	if (t0.type === TokenType.word &&
		t1.type === TokenType.operator && t1.value === '=') {
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

	const varName = t0.value

	const varNode = lookup(parentNode, varName)
	if (varNode === null)
		throw new Error('Cannot find a variable: ' + varName)
	if (varNode.type === NodeType.localConst || varNode.type === NodeType.globalConst)
		throw new Error('Cannot assign value to a constant: ' + varName)

	const nodeType = varNode.type === NodeType.globalVar ? NodeType.globalSet : NodeType.localSet
	const varSet   = makeNode(parentNode, nodeType, varNode.value, varNode.dataType, t0)

	return parseExpression(varSet, tokens, index+2)
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

	if (t0.type === TokenType.punctuation && [';', ',', ')'].includes(t0.value) )
		return index+1

	// Open parenthesis
	if (t0.type === TokenType.punctuation && t0.value === '(') {
		const openParen = makeNode(parentNode, NodeType.expression, '', parentNode.dataType, t0)
		index = parseExpression(openParen, tokens, index+1)
		return parseExpressionChain(parentNode, tokens, index)
	}

	// Number
	// 42 | 3.14F
	if (t0.type === TokenType.number) {
		const sfxMatch = t0.value.match(/([LFD])$/)
		const suffix   = sfxMatch ? sfxMatch[1] : ''
		const decPoint = t0.value.includes('.')

		switch (suffix) {
			case 'L': {
				if (decPoint)
					throw new Error(`[${t0.line+1}, ${t0.column+1}] Wrong number suffix L in:  ${t0.value}`)
				if (parentNode.dataType !== DataType.i64)
					throw new Error(`[${t0.line+1}, ${t0.column+1}] Wrong data type. Expected ${parentNode.dataType}, but got i64: ${t0.value}`)
				makeNode(parentNode, NodeType.number, parseInt(t0.value), DataType.i64, t0)
				break
			}
			case 'F': {
				if (t0.value.length > 8)
					throw new Error(`[${t0.line+1}, ${t0.column+1}] Losing precision in:  ${t0.value}`)
				if (parentNode.dataType !== DataType.f32)
					throw new Error(`[${t0.line+1}, ${t0.column+1}] Wrong data type. Expected ${parentNode.dataType}, but got f32: ${t0.value}`)
				makeNode(parentNode, NodeType.number, parseFloat(t0.value), DataType.f32, t0)
				break
			}
			case 'D': {
				if (parentNode.dataType !== DataType.f64)
					throw new Error(`[${t0.line+1}, ${t0.column+1}] Wrong data type. Expected ${parentNode.dataType}, but got f64: ${t0.value}`)
				makeNode(parentNode, NodeType.number, parseFloat(t0.value), DataType.f64, t0)
				break
			}
			default: {
				if (decPoint) {
					if (t0.value.length > 8 || parentNode.dataType === DataType.f64) {
						if (parentNode.dataType !== DataType.f64)
							throw new Error(`[${t0.line+1}, ${t0.column+1}] Wrong data type. Expected ${parentNode.dataType}, but got f64: ${t0.value}`)
						makeNode(parentNode, NodeType.number, parseFloat(t0.value), DataType.f64, t0)
					}
					else {
						if (parentNode.dataType !== DataType.f32)
							throw new Error(`[${t0.line+1}, ${t0.column+1}] Wrong data type. Expected ${parentNode.dataType}, but got f32: ${t0.value}`)
						makeNode(parentNode, NodeType.number, parseFloat(t0.value), DataType.f32, t0)
					}
				}
				else {
					makeNode(parentNode, NodeType.number, parseInt(t0.value), parentNode.dataType, t0)
				}
			}
		}

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
	if (t0.type === TokenType.word &&
		t1.type === TokenType.punctuation && t1.value === '(') {
		const funcName = t0.value
		const funcNode = lookup(parentNode, funcName)

		if (funcNode === null || funcNode.type !== NodeType.function)
			throw new Error(`[${t0.line+1}, ${t0.column+1}] Cannot find a function: ${funcName}`)

		const funcCall = makeNode(parentNode, NodeType.functionCall, t0.value, funcNode.dataType, t0)
		index += 2

		// Void call
		if (t1.type === TokenType.punctuation && t1.type === ')')
			return parseExpressionChain(parentNode, tokens, index)

		do {
			index = parseExpression(funcCall, tokens, index)
		} while(tokens[index-1].type === TokenType.punctuation && tokens[index-1].value === ',' )

		return parseExpressionChain(parentNode, tokens, index)
	}

	// Variable lookup
	// foo
	if (t0.type === TokenType.word) {
		const varNode = lookup(parentNode, t0.value)
		if (varNode === null)
			throw new Error('Cannot find a variable: ' + t0.value)

		const nodeType = varNode.type === NodeType.globalVar || varNode.type === NodeType.globalConst
			? NodeType.globalGet
			: NodeType.localGet

		makeNode(parentNode, nodeType, varNode.value, varNode.dataType, t0)
		return parseExpressionChain(parentNode, tokens, index+1)
	}

	throw new Error(`[${t0.line+1}, ${t0.column+1}] Unrecognised expression symbol in ${parentNode.type}:  ${t0.value}`)
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
