// Rule 110
// https://en.wikipedia.org/wiki/Rule_110

#import-func js setCell    = void setCell(int index, int value)
#import-func js printTable = void printTable()
#export-func rule110 = rule110

int table[100];
const int SIZE = 100;

void logTable()
{
	int i;

	for (i=0; i<SIZE; i+=1)
		setCell(i, table[i]);

	printTable();
}

void initTable()
{
	int i;

	for (i=0; i<SIZE; i+=1)
		table[i] = 0;

	table[SIZE-1] = 1;
}

void rule110(const int maxCycles)
{
	int i, cycle;
	int pattern, temp;

	initTable();
	logTable();

	cycle = 0;
	while (cycle < maxCycles) {
		temp = table[0];

		for (i=1; i<SIZE-1; i+=1) {
			pattern = 100*temp + 10*table[i] + table[i+1];
			temp = table[i];

			if (pattern == 111) table[i] = 0;
			if (pattern == 110) table[i] = 1;
			if (pattern == 101) table[i] = 1;
			if (pattern == 100) table[i] = 0;
			if (pattern == 011) table[i] = 1;
			if (pattern == 010) table[i] = 1;
			if (pattern == 001) table[i] = 1;
			if (pattern == 000) table[i] = 0;
		}

		logTable();
		cycle += 1;
	}
}
