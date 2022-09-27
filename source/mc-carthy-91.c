// McCarthy 91 function
// https://en.wikipedia.org/wiki/McCarthy_91_function
// The McCarthy 91 function is a recursive function, defined by the computer scientist John McCarthy
// as a test case for formal verification within computer science.

#import-func js logInt = void logInt(int num)
#export-func runTest = runTest

int mc91rec(int n, int c)
{
	if (c != 0) {
		if (n > 100)
			return mc91rec(n - 10, c - 1);

		return mc91rec(n + 11, c + 1);
	}

	return n;
}

int mc91(int n)
{
	return mc91rec(n, 1);
}

void runTest()
{
	int i, res;

	i = 90;
	while(i < 120) {
		res = mc91(i);
		logInt(res);
		i += 1;
	}
}
