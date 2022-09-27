// https://webassembly.github.io/wabt/demo/wat2wasm/

const wasmInstance = new WebAssembly.Instance(wasmModule, {})
const { sumEvenFiboNumbers } = wasmInstance.exports

const actual   = Number( sumEvenFiboNumbers() )
const expected = 4613732
console.log(actual)
console.log('Passed: ' + (actual === expected ? 'OK' : 'FAILED!'))
