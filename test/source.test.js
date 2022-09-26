'use strict'

const {strictEqual} = require('assert')
const {join}        = require('path')
const {readFileSync, readdirSync, existsSync, writeFileSync} = require('fs')
const {describe, it} = require('@popovmp/mocha-tiny')
const {ciToWat}      = require('../index')


describe('Test Cinonim source code', () => {

	const sourceDir = join(__dirname, '..', 'source')
	const filenames = readdirSync(sourceDir)

	for (const filename of filenames) {
		testFile(filename)
	}

	function testFile(filename)
	{
		if (filename.endsWith('.c')) {
			const cinFilename = join(sourceDir, filename)
			const watFilename = cinFilename.replace('.c', '.wat')

			it(filename, () => {
				const cinSourceCode = readFileSync(cinFilename, {encoding: 'ascii'})
				const compiledWat   = ciToWat(cinSourceCode)

				const watExists = existsSync(watFilename)
				if (!watExists) {
					// Create WAT file
					writeFileSync(watFilename, compiledWat, {encoding: 'ascii'})
					console.log(`WAT created: ${filename.replace('.c', '.wat')}`)
					return
				}

				const loadedWat = readFileSync(watFilename, {encoding: 'ascii'})
				strictEqual(compiledWat, loadedWat)
			})
		}
	}
})

