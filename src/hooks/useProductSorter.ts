import type { ProductWithCode } from '@/utils/product';
import { useState } from 'react';

export interface SortStateEntry {
	field: keyof ProductWithCode;
	direction?: 'asc' | 'desc';
}

const fieldsOfDecimalType: (keyof ProductWithCode)[] = ['quantityInStock', 'salesPrice'];

const useProductSorter = () => {
	const [sorts, setSorts] = useState<SortStateEntry[]>([]);

	const performSorts = (a: ProductWithCode, b: ProductWithCode) => {
		let result: 1 | -1 | 0 = 0;

		for (let i = 0; result === 0 && i < sorts.length; i++) {
			const sortEntry: SortStateEntry | null = sorts[i] ?? null;
			if (sortEntry) {
				const { field, direction } = sortEntry;
				const [aField, bField] = [a, b].map(product => {
					const result = product[field];

					if (fieldsOfDecimalType.includes(field) && result !== null) {
						// Decimal fields must be coerced to Number or else will be sorted as a String
						return +result;
					}
					return result;

				});

				if (aField === null || aField === undefined) {
					if (bField === null || bField === undefined) {
						result = 0;
					} else {
						result = -1;
					}
				} else if (bField === null || bField === undefined) {
					result = 1;
				} else if (aField < bField) {
					result = -1;
				} else if (aField > bField) {
					result = 1;
				}

				if (result !== 0 && direction === 'desc') {
					result /= -1;
				}
			}
		}
		return result;
	};

	const addSort = (
		{
			field,
			direction = 'asc'
		}: SortStateEntry
	) => {
		setSorts((prevSorts) => [...prevSorts, { field, direction }]);
	};

	const removeSort = (index: number) => {
		setSorts((prevSorts) => prevSorts.slice(0, index).concat(prevSorts.slice(index + 1)));
	};

	const moveSort = (fromIndex: number, toIndex: number) => {

		setSorts((prevSorts) => {
			// Check that indices are different, and both indices are in range
			if (fromIndex === toIndex
				|| ![fromIndex, toIndex].every((index) => index >= 0 && index < prevSorts.length)
			) {
				return prevSorts;
			}

			const result = [...prevSorts];
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			result.splice(toIndex, 0, result.splice(fromIndex, 1)[0]!);

			return result;
		});
	};

	const reverseSortDirection = (index: number) => {

		setSorts((prevSorts) => {
			const updatedSortEntry = prevSorts[index];
			if (!updatedSortEntry || index < 0 || index >= prevSorts.length) {
				return prevSorts;
			}

			return prevSorts
				.slice(0, index)
				.concat(
					[
						{
							...updatedSortEntry,
							direction: updatedSortEntry.direction === 'asc' ? 'desc' : 'asc'
						},
						...prevSorts.slice(index + 1)
					]
				);
		});
	};

	const resetSorts = () => {
		setSorts([]);
	};

	const getSorts = () => [...sorts];

	return {
		addSort,
		removeSort,
		moveSort,
		reverseSortDirection,
		performSorts,
		resetSorts,
		getSorts
	};
};

export default useProductSorter;