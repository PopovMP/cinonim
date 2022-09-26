double arr[100];

double dataTypes(
	const int    intPar,
	const long   longPar,
	const float  floatPar,
	const double doublePar)
{
	int    intVar;
	long   longVar;
	float  floatVar;
	double doubleVar;

	intVar  = intPar;
	longVar = ((long) intVar);

	return longVar + ((double) floatPar) + doublePar;
}

double expression(float m, float n)
{
    float p;

    p = m + 1;
    p = m + 2 * 3 + 4 * m;

    return ((double) p);
}

void forLoop()
{
	int i, j;

	for (;;) {
		break;
	}

	for (i = 0; ;i += 1) {
		break;
	}

	for (i = 0; i < 10; i += 1) {
	}

	for (i = 0, j = 10; i < 10; i += 1, j -= 1)
		i += j;
}

long doLoop(int n)
{
	long res;

	do {
		if (n) {
			res = 42L;
			break;
		}
		res = 7L;

		if (n < 5) continue;

	} while (n);

	return res;
}

long whileLoop(int n)
{
	long curr, prev, temp;

	curr = 1;
	prev = 1;

	while (1) {
		if (n <= 2)
			break;

		temp  = curr;
		curr += prev;
		prev  = temp;
		n	-= 1;
	}

	return curr;
}

void voidReturnFromBody()
{
	return;
}

void voidReturnFromLoop()
{
	while(1) {
		return;
	}
}

float twoReturns(float n)
{
	while(1) {
		return n;
	}

	return n + 2;
}

float arrayAllocation()
{
    int i;
    i = 42;
    arr[i-1] = arr[i-2];
}
