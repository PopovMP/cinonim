// Largest palindrome product
//
// A palindromic number reads the same both ways.
// The largest palindrome made from the product of two 2-digit numbers is 9009 = 91 × 99.
//
// Find the largest palindrome made from the product of two 3-digit numbers.

// JavaScript
// const wasmExport   = { console: { log: console.log } }
// const wasmInstance = new WebAssembly.Instance(wasmModule, wasmExport)
// const {largestPalindrome} = wasmInstance.exports
// console.log('Largest palindrome: ' + largestPalindrome())

#export-func largestPalindrome = largestPalindrome
#import-func console log = void logInt(int val)

// Check is a 6 digit number palindrome
int isPalindrome(int num) {
	int m, n, p, q;

	m = 100000 * (num %   10);
	n =   1000 * (num %  100 - num %  10);
	p =     10 * (num % 1000 - num % 100);
	q =           num % 1000;

	return m+n+p+q == num;
}

int largestPalindrome()
{
	int a, b, product, palindrome, steps;
	palindrome = 0;
	steps = 0;

	for (a=999; a>99; a-=1) {
		for (b=999; b>99; b-=1) {
			product = a * b;
			steps += 1;
			if ( isPalindrome(product) && product > palindrome)
				palindrome = product;
		}
	}

	// Log count of loops. (Useful for code optimization.)
	logInt(steps);

	return palindrome;
}
