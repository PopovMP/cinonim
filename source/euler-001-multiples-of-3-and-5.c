// If we list all the natural numbers below 10 that are multiples of 3 or 5,
// we get 3, 5, 6 and 9. The sum of these multiples is 23.
// Find the sum of all the multiples of 3 or 5 below 1000.

#export-func sumMultiples = sumMultiples

const int MAX = 1000;

long sumMultiples()
{
    long sum;
	int n;

	sum = 0;

	for (n = 0; n < MAX; n += 1) {
		if (n % 3 == 0 || n % 5 == 0)
			sum += ((long) n);
	}

	return sum;
}
