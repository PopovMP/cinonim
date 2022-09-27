// https://webassembly.github.io/wabt/demo/wat2wasm/

const wasmInstance = new WebAssembly.Instance(wasmModule, {})

const {largestPalindrome} = wasmInstance.exports

const actual   = Number( largestPalindrome() )
const expected = 906609

console.log('Largest palindrome: ' + actual)
console.log('Passed: ' + (actual === expected ? 'OK' : 'FAILED!'))
