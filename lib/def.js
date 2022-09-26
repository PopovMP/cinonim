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
	cast         : 'cast',
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

/**
 * Keyword
 * @enum {string}
 */
const Keyword = {
	break   : 'break',
	const   : 'const',
	continue: 'continue',
	do      : 'do',
	double  : 'double',
	else    : 'else',
	float   : 'float',
	for     : 'for',
	if      : 'if',
	int     : 'int',
	long    : 'long',
	return  : 'return',
	void    : 'void',
	while   : 'while',
}

// noinspection JSUnusedLocalSymbols
const OperatorPrecedence = {
	'('  : 18, ')'  : 18,
	'['  : 17, ']'  : 17, 'funcCall': 17, 'cast': 17,
	'.++': 15, '.--': 15, // Postfix increment, decrement
	'++.': 14, '--.': 14, // Prefix  increment, decrement
	'-.' : 14, '!'  : 14, // Negate, not
	'**' : 13,            // Power
	'*'  : 12, '/'  : 12, '%': 12,
	'+'  : 11, '-'  : 11,
	'<'  : 9,  '<=' : 9,  '>': 9, '>=': 9,
	'==' : 8, '!='  : 8,
	'&&' : 4,
	'||' : 3,
	'?:' : 2, // Ternary operator
	','  : 1, // Comma sequence
}

module.exports = {
	DataType,
	Keyword,
	NodeType,
	OperatorPrecedence,
	TokenType,
}
