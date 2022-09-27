// https://webassembly.github.io/wabt/demo/wat2wasm/

const table = Array(100)

function setCell(index, value) {
	table[index] = value
}

function printTable() {
	const tableText = table.map(cell => cell === 0 ? '.' : '#').join('')
	console.log(tableText)
}

const wasmImport = {
	js: {
		setCell,
		printTable,
	}
}

const wasmInstance = new WebAssembly.Instance(wasmModule, wasmImport);
const { rule110 } = wasmInstance.exports;

rule110(100)
