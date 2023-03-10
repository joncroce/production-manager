import useSorter, { type SortStateItem } from './useSorter';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ViewProduct } from '@/schemas/product';

const mockProductBase: ViewProduct = {
	code: '',
	baseCodeId: 0,
	sizeCodeId: 0,
	variantCodeId: 0,
	description: '',
	quantityInStock: 0,
	salesPrice: 0
};

const shuffleAtRandom = () => Math.random() - 0.5;

const makeShuffledCopy = (arr: ViewProduct[]) => {
	const result = [...arr];
	while (!result.every((v, i) => arr[i] !== v)) {
		result.sort(shuffleAtRandom);
	}
	return result;
};

describe('product sorting', () => {
	const { result } = renderHook(() => useSorter<ViewProduct>());

	beforeEach(() => {
		act(() => { result.current.resetSorts(); });
	});

	it('can add and remove a sort', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId' });
		});

		expect(result.current.getSorts().length === 1);
		act(() => {
			result.current.removeSort(0);
		});

		expect(result.current.getSorts().length === 0);
	});

	it('can move a sort', () => {
		const sortEntries: SortStateItem<ViewProduct>[] = [
			{ field: 'baseCodeId', direction: 'asc' },
			{ field: 'sizeCodeId', direction: 'asc' },
			{ field: 'variantCodeId', direction: 'asc' },
			{ field: 'quantityInStock', direction: 'asc' },
			{ field: 'salesPrice', direction: 'asc' },
			{ field: 'description', direction: 'asc' },
		];

		// Move item to lower position
		act(() => {
			sortEntries.forEach((entry) => {
				result.current.addSort(entry);
			});

			result.current.moveSort(2, 0);
		});

		expect(result.current.getSorts()).toEqual([
			{ field: 'variantCodeId', direction: 'asc' },
			{ field: 'baseCodeId', direction: 'asc' },
			{ field: 'sizeCodeId', direction: 'asc' },
			{ field: 'quantityInStock', direction: 'asc' },
			{ field: 'salesPrice', direction: 'asc' },
			{ field: 'description', direction: 'asc' },
		]);


		// Move item to higher position
		act(() => {
			result.current.moveSort(2, 4);
		});

		expect(result.current.getSorts()).toEqual([
			{ field: 'variantCodeId', direction: 'asc' },
			{ field: 'baseCodeId', direction: 'asc' },
			{ field: 'quantityInStock', direction: 'asc' },
			{ field: 'salesPrice', direction: 'asc' },
			{ field: 'sizeCodeId', direction: 'asc' },
			{ field: 'description', direction: 'asc' },
		]);

		// Move item to or from same position or out-of-range position should change nothing
		act(() => {
			result.current.moveSort(-1, 1);
			result.current.moveSort(2, 7);
			result.current.moveSort(4, 4);
		});

		expect(result.current.getSorts()).toEqual([
			{ field: 'variantCodeId', direction: 'asc' },
			{ field: 'baseCodeId', direction: 'asc' },
			{ field: 'quantityInStock', direction: 'asc' },
			{ field: 'salesPrice', direction: 'asc' },
			{ field: 'sizeCodeId', direction: 'asc' },
			{ field: 'description', direction: 'asc' },
		]);
	});

	it('can reverse the direction of a sort entry', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'asc' });
			result.current.reverseSortDirection(0);
		});

		expect(result.current.getSorts()[0])
			.toEqual({ field: 'baseCodeId', direction: 'desc' });
	});

	it('can sort Number types ascending by default', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId' });
		});

		const [a, b] = [
			{ ...mockProductBase, baseCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1 },
		];

		expect([b, a].sort(result.current.performSorts)).toEqual([a, b]);
	});

	it('can sort by one field of Number type, ascending', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'asc' });
		});

		const [a, b] = [
			{ ...mockProductBase, baseCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1 },
		];

		expect([b, a].sort(result.current.performSorts)).toEqual([a, b]);
	});

	it('can sort by one field of Number type, descending', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'desc' });
		});

		const [a, b] = [
			{ ...mockProductBase, baseCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0 },
		];

		expect([b, a].sort(result.current.performSorts)).toEqual([a, b]);
	});

	it('can sort by two fields of Number type, either both ascending or both descending', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'asc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'asc' });
		});

		const [a, b, c, d] = [
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1 },
		];

		expect([c, b, a, d].sort(result.current.performSorts)).toEqual([a, b, c, d]);

		act(() => {
			result.current.resetSorts();
			result.current.addSort({ field: 'baseCodeId', direction: 'desc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'desc' });
		});

		expect([c, b, a, d].sort(result.current.performSorts)).toEqual([a, b, c, d].reverse());
	});

	it('can sort by two fields of Number type, first ascending then descending', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'asc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'desc' });
		});

		const [a, b, c, d] = [
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0 },
		];

		expect([c, b, a, d].sort(result.current.performSorts)).toEqual([a, b, c, d]);
	});

	it('can sort by two fields of Number type, first descending then ascending', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'desc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'asc' });
		});

		const [a, b, c, d] = [
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1 },
		];

		expect([c, b, a, d].sort(result.current.performSorts)).toEqual([a, b, c, d]);
	});

	it('can sort by three fields of Number type, all ascending', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'asc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'asc' });
			result.current.addSort({ field: 'variantCodeId', direction: 'asc' });
		});

		const products = [
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1 },
		];

		expect(makeShuffledCopy(products).sort(result.current.performSorts)).toEqual(products);
	});

	it('can sort by three fields of Number type, all descending', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'desc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'desc' });
			result.current.addSort({ field: 'variantCodeId', direction: 'desc' });
		});

		const products = [
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0 },
		];

		expect(makeShuffledCopy(products).sort(result.current.performSorts)).toEqual(products);
	});

	it('can sort by three fields of Number type, mixed directions (asc->asc->desc)', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'asc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'asc' });
			result.current.addSort({ field: 'variantCodeId', direction: 'desc' });
		});

		const products = [
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0 },
		];

		expect(makeShuffledCopy(products).sort(result.current.performSorts)).toEqual(products);
	});

	it('can sort by three fields of Number type, mixed directions (asc->desc->asc)', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'asc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'desc' });
			result.current.addSort({ field: 'variantCodeId', direction: 'asc' });
		});

		const products = [
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1 },
		];

		expect(makeShuffledCopy(products).sort(result.current.performSorts)).toEqual(products);
	});

	it('can sort by three fields of Number type, mixed directions (desc->asc->asc)', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'desc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'asc' });
			result.current.addSort({ field: 'variantCodeId', direction: 'asc' });
		});

		const products = [
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1 },
		];

		expect(makeShuffledCopy(products).sort(result.current.performSorts)).toEqual(products);
	});

	it('can sort by three fields of Number type, mixed directions (asc->desc->desc)', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'asc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'desc' });
			result.current.addSort({ field: 'variantCodeId', direction: 'desc' });
		});

		const products = [
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0 },
		];

		expect(makeShuffledCopy(products).sort(result.current.performSorts)).toEqual(products);
	});

	it('can sort by three fields of Number type, mixed directions (desc->desc->asc)', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'desc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'desc' });
			result.current.addSort({ field: 'variantCodeId', direction: 'asc' });
		});

		const products = [
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1 },
		];

		expect(makeShuffledCopy(products).sort(result.current.performSorts)).toEqual(products);
	});

	it('can sort by three fields of Number type, mixed directions (desc->asc->desc)', () => {
		act(() => {
			result.current.addSort({ field: 'baseCodeId', direction: 'desc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'asc' });
			result.current.addSort({ field: 'variantCodeId', direction: 'desc' });
		});

		const products = [
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1 },
			{ ...mockProductBase, baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0 },
		];

		expect(makeShuffledCopy(products).sort(result.current.performSorts)).toEqual(products);
	});

	it('can sort by all fields of mixed type and mixed directions', () => {
		act(() => {
			result.current.addSort({ field: 'code', direction: 'desc' });
			result.current.addSort({ field: 'baseCodeId', direction: 'asc' });
			result.current.addSort({ field: 'sizeCodeId', direction: 'desc' });
			result.current.addSort({ field: 'variantCodeId', direction: 'asc' });
			result.current.addSort({ field: 'quantityInStock', direction: 'desc' });
			result.current.addSort({ field: 'salesPrice', direction: 'asc' });
			result.current.addSort({ field: 'description', direction: 'desc' });
		});

		const products: ViewProduct[] = [
			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'z', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 0, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 1, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 0, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 3.5, salesPrice: 3.5, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 0.0, description: 'a' },

			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'z' },
			{ code: 'a', baseCodeId: 1, sizeCodeId: 0, variantCodeId: 1, quantityInStock: 0.0, salesPrice: 3.5, description: 'a' },
		];

		expect(makeShuffledCopy(products).sort(result.current.performSorts)).toEqual(products);
	});
});