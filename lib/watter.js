'use strict'

const {NodeType, DataType, OperatorMap} = require('./def')

/**
 * Compile Cinonim AST to WAT
 *
 * @param {Node} moduleNode
 *
 * @return {string}
 */
function astToWat(moduleNode)
{
	const output = []

	compileAst(moduleNode, output, 0)

	return output.join('')
}

/**
 * @param {Node}     node
 * @param {string[]} output
 * @param {number}   depth
 */
function compileAst(node, output, depth)
{
	// Module
	if (node.type === NodeType.module) {
		output.push('(module')

		if (node.nodes.length > 0) {
			output.push('\n')
			for (const child of node.nodes)
				compileAst(child, output, depth + 1)
		}

		output.push(')')
		return
	}

	// Export function
	// #export-func foo = myFoo
	if (node.type === NodeType.exportFunc) {
		const funcName   = node.value
		const exportName = node.data[0]

		add(`(export "${exportName}" (func $${funcName}))`, output, depth)
		return
	}

	// Import function
	// #import-func console log = void logInt(int val)
	// (import "console" "log" (func $logInt (param i32)))
	if (node.type === NodeType.importFunc) {
		const funcName = node.value
		const [funcParams] = node.nodes
		const [importModule, importName] = node.data
		const params = funcParams.nodes.map( param => `(param ${param.dataType})`).join(' ')
		add(`(import "${importModule}" "${importName}" (func $${funcName} ${params}))`, output, depth)
		return
	}

	// Global variable
	// int foo = 42;
	if (node.type === NodeType.globalVar) {
		const name     = node.value
		const dataType = node.dataType
		const value    = node.nodes[0].value

		add(`(global $${name} (mut ${dataType}) (${dataType}.const ${value}))`, output, depth)
		return
	}

	// Global constant
	// const int foo = 42;
	if (node.type === NodeType.globalConst) {
		const name     = node.value
		const dataType = node.dataType
		const value    = node.nodes[0].value

		add(`(global $${name} ${dataType} (${dataType}.const ${value}))`, output, depth)
		return
	}

	// Function definition
	// int foo(int bar, const int baz) { }
	// function
	//   +-- funcParams
	//   \-- funcBody
	if (node.type === NodeType.function) {
		const name       = node.value
		const dataType   = node.dataType
		const funcParams = node.nodes[0]
		const funcBody   = node.nodes[1]

		const params = funcParams.nodes.map(param => ` (param $${param.value} ${param.dataType})`).join('')
		const result = dataType === DataType.void ? '' : ` (result ${dataType})`

		add(`(func $${name}${params}${result}`, output, depth)

		// Local declaration
		// int foo;
		for (const child of funcBody.nodes) {
			if (child.type !== NodeType.localVar) break
			add(`(local $${child.value} ${child.dataType})`, output, depth+1)
		}

		for (const child of funcBody.nodes)
			compileForm(child, output, depth+1)

		add(')', output, depth)
		return
	}

	die('Unknown code in module:', node)
}

/**
 * @param {Node}     node
 * @param {string[]} output
 * @param {number}   depth
 */
function compileForm(node, output, depth)
{
	// Local are compiled before the function's return block
	if (node.type === NodeType.localVar) return

	// Function return
	// return expression?;}
	if (node.type === NodeType.return) {
		if (node.nodes.length === 1) {
			const res = compileExpression(node.nodes, 0,depth)
			add(res, output, depth)
		}
		// Skip "return" if not located directly in the func body
		if (node.parent.type !== NodeType.funcBody)
			add(`(return)`, output, depth)
		return
	}

	// break    index?;}
	// continue index?;}
	if (node.type === NodeType.break || node.type === NodeType.condition) {
		add(`(br ${node.value})`, output, depth)
		return
	}

	// for (assignment; condition; assignment) { FORM }
	// for
	//    +-- statement
	//    +-- condition
	//    +-- statement
	//    \-- loopBody
	if (node.type === NodeType.for) {
		const [initNode, condNode, incNode, loopBody] = node.nodes

		for (const assign of initNode.nodes)
			compileAssignment(assign, output, depth)

		add(`(block`, output, depth)
		add(`(loop` , output, depth)

		if (condNode.nodes.length > 0) {
			const predicate = compileExpression(condNode.nodes, 0, depth)
			add(`(br_if 1 (i32.eqz ${predicate}))`, output, depth+1)
		}

		for (const child of loopBody.nodes)
			compileForm(child, output, depth+1)

		for (const assign of incNode.nodes)
			compileAssignment(assign, output, depth+1)

		add(`(br 0)`, output, depth+1)
		add('))', output, depth)
		return
	}

	// do { FORM } while (condition);
	// do
	//    +-- loopBody
	//    \-- condition
	if (node.type === NodeType.do) {
		const [loopBody, condNode] = node.nodes

		add(`(block`, output, depth)
		add(`(loop` , output, depth)

		for (const child of loopBody.nodes)
			compileForm(child, output, depth+1)

		const predicate = compileExpression(condNode.nodes, 0, depth)
		add(`(br_if 0 ${predicate})`, output, depth+1)

		add('))', output, depth)
		return
	}

	// while (condition) { FORM }
	// while
	//    +-- condition
	//    \-- loopBody
	if (node.type === NodeType.while) {
		const [condNode, loopBody] = node.nodes

		add(`(block`, output, depth)
		add(`(loop` , output, depth)

		const predicate = compileExpression(condNode.nodes, 0, depth)
		add(`(br_if 1 (i32.eqz ${predicate}))`, output, depth+1)

		for (const child of loopBody.nodes)
			compileForm(child, output, depth+1)

		add(`(br 0)`, output, depth+1)
		add('))', output, depth)
		return
	}

	// if (condition) { FORM }
	// if (condition) { FORM } else { FORM }
	// if
	//    +-- condition
	//    +-- then
	//    \-- else
	if (node.type === NodeType.if) {
		const [condNode, thenNode, elseNode] = node.nodes
		const isReturnInThen = searchChildNode(thenNode, NodeType.return)

		const predicate = compileExpression(condNode.nodes, 0, depth)
		add(predicate, output, depth)
		add(`(if (then`, output, depth)

		for (const child of thenNode.nodes)
			compileForm(child, output, depth+1)

		// Skip "else" if there is a "return" in "then"
		if (elseNode && !isReturnInThen) {
			add(`)(else`, output, depth)
			for (const child of elseNode.nodes)
				compileForm(child, output, depth+1)
		}

		add(`))`, output, depth)

		// Plot the "else"'s code after "if" in case of "return" in "then"
		if (elseNode && isReturnInThen) {
			for (const child of elseNode.nodes)
				compileForm(child, output, depth)
		}
		return;
	}

	// function call
	// foo(1, 2);
	if (node.type === NodeType.functionCall) {
		const funcCall = compileFunctionCall(node, depth)
		add(funcCall, output, depth)
		return
	}

	// Assignment
	// foo = expression;
	if (node.type === NodeType.localSet || node.type === NodeType.globalSet) {
		compileAssignment(node, output, depth)
		return
	}

	die('Unknown code in function:', node)
}

/**
 * Compiles an expression and returns WAT string
 *
 * @param  {Node[]} nodes
 * @param  {number} index
 * @param  {number} depth
 *
 * @return {string}
 */
function compileExpression(nodes, index, depth)
{
	const node = nodes[index]
	switch (node.type) {
		case NodeType.expression:
			return node.nodes.map((_, i, arr) => compileExpression(arr, i, depth)).join(' ')
		case NodeType.number:
			return `(${node.dataType}.const ${node.value})`
		case NodeType.localGet:
			return `(local.get $${node.value})`
		case NodeType.globalGet:
			return `(global.get $${node.value})`
		case NodeType.operator:
			return compileOperator(nodes, index)
		case NodeType.cast:
			return compileCast(nodes, index)
		case NodeType.functionCall:
			return compileFunctionCall(node, depth)
		default:
			die('Unknown code in expression:', node)
	}
}

/**
 * Compiles a variable assignment
 *
 * @param {Node}     node
 * @param {string[]} output
 * @param {number}   depth
 *
 * @return {void}
 */
function compileAssignment(node, output, depth)
{
	const scope = node.type === NodeType.localSet ? 'local' : 'global'
	const name  = node.value
	const expr  = compileExpression(node.nodes, 0, depth)

	add(`(${scope}.set $${name} ${expr})`, output, depth)
}

/**
 * Compiles an operator and returns WAT string
 *
 * @param  {Node[]} nodes
 * @param  {number} index
 *
 * @return {string}
 */
function compileOperator(nodes, index)
{
	const operator = nodes[index]
	const a = nodes[index-2]
	const b = nodes[index-1]

	switch (operator.value) {
		case '<<': {
			return `(${operator.dataType}.${OperatorMap[operator.value]})`
		}
		case '+':
		case '-':
		case '*':
		case '==':
		case '!=':
		case '&&':
		case '||': {
			if (a.dataType === b.dataType)
				return `(${a.dataType}.${OperatorMap[operator.value]})`
			die(`Operands have different data types: ${a.dataType} and ${b.dataType} in`, operator.value)
			break
		}
		case '<':
		case '>':
		case '<=':
		case '>=': {
			if (a.dataType === b.dataType) {
				if (a.dataType === DataType.i32 || a.dataType === DataType.i64)
					return `(${a.dataType}.${OperatorMap[operator.value]}_s)`
				else
					return `(${a.dataType}.${OperatorMap[operator.value]})`
			}
			die(`Operands have different data types: ${a.dataType} and ${b.dataType} in`, operator.value)
			break
		}
		case '/':
		case '%':
		case '>>': {
			if (operator.dataType === DataType.i32 || operator.dataType === DataType.i64)
				return `(${operator.dataType}.${OperatorMap[operator.value]}_s)`
			else
				return `(${operator.dataType}.${OperatorMap[operator.value]})`
		}
	}

	return die('Unknown operator:', operator)
}

/**
 * Compiles a cast and returns WAT string
 *
 * @param  {Node[]} nodes
 * @param  {number} index
 *
 * @return {string}
 */
function compileCast(nodes, index)
{
	const node     = nodes[index]
	const toType   = node.dataType
	const fromType = nodes[index-1].dataType

	switch (toType) {
		case 'i32': {
			switch (fromType) {
				case 'i32': return ''
				case 'i64': return '(i32.wrap_i64)'
				case 'f32': return '(i32.trunc_f32_s)'
				case 'f64': return '(i32.trunc_f64_s)'
			}
			break
		}
		case 'i64': {
			switch (fromType) {
				case 'i32': return '(i64.extend_i32_s)'
				case 'i64': return ''
				case 'f32': return '(i64.trunc_f32_s)'
				case 'f64': return '(i64.trunc_f64_s)'
			}
			break
		}
		case 'f32': {
			switch (fromType) {
				case 'i32': return '(f32.convert_i32_s)'
				case 'i64': return '(f32.convert_i64_s)'
				case 'f32': return ''
				case 'f64': return '(f32.demote_f64)'
			}
			break
		}
		case 'f64': {
			switch (fromType) {
				case 'i32': return '(f64.convert_i32_s)'
				case 'i64': return '(f64.convert_i64_s)'
				case 'f32': return '(f64.promote_f32)'
				case 'f64': return ''
			}
			break
		}
	}

	return die('Unknown code in cast:', node)
}

/**
 * Compiles a function call.
 * Plots each argument and the function call
 * on a new line in a stack-based style.
 *
 * @param {Node  } funcCall
 * @param {number} depth
 *
 * @return {string}
 */
function compileFunctionCall(funcCall, depth)
{
	return funcCall.nodes
			.map((_, i, arr) => i === 0
				? compileExpression(arr, i, depth)                  // Don't left-pad the first argument
				: leftPad(compileExpression(arr, i, depth), depth)) // Left-pad rest of arguments
			.join('\n') + '\n' +                                    // Plot each argument on a new line
		leftPad(`(call $${funcCall.value})`, depth)             // Left-pad the function call
}

/**
 * Searches a child node of a given type
 *
 * @param {Node}     parenNode
 * @param {NodeType} nodeType
 *
 * @return {Node|null}
 */
function searchChildNode(parenNode, nodeType)
{
	let result = null;

	loop(parenNode)

	return result

	function loop(parenNode)
	{
		for (const node of parenNode.nodes) {
			if (node.type === nodeType) {
				result = node
				return
			}

			if (result === null)
				loop(node, nodeType)
		}
	}
}

/**
 * Writes "wat" code to "output" at "depth"
 *
 * @param {string}   wat
 * @param {string[]} output
 * @param {number}   depth
 */
function add(wat, output, depth)
{
	output.push(leftPad(wat, depth) + '\n')
}

/**
 * Adds left padding
 *
 * @param {string} wat
 * @param {number} depth
 *
 * @return {string}
 */
function leftPad(wat, depth)
{
	return '    '.repeat(depth) + wat
}

/**
 * Throws error
 *
 * @param {string} message
 * @param {Node} node
 */
function die(message, node)
{
	const token    = node.token
	const dataType = node.dataType === DataType.na ? '' : `: ${node.dataType}`
	const value    = node.value    === '' ? '' : ` ${node.value}`
	throw new Error(`[${token.line+1}, ${token.column+1}] ${message} "${node.type}"${dataType}${value}`)
}

module.exports = {
	astToWat
}
