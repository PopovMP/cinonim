const wasmImport = { js: { logInt: n => console.log(n)  }}

const wasmInstance = new WebAssembly.Instance(wasmModule, wasmImport)
const { runTest } = wasmInstance.exports

runTest()
