import type { Row } from '@tanstack/react-table';
import type { Prisma } from '@prisma/client';
import { parseProductCode } from './product';

export function sortDecimal<TData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string): number {
	const decimalA = rowA.getValue<Prisma.Decimal | null>(columnId);
	const decimalB = rowB.getValue<Prisma.Decimal | null>(columnId);

	if (decimalA === null) {
		return -1;
	} else if (decimalB === null) {
		return 1;
	} else {
		const a = decimalA.toNumber();
		const b = decimalB.toNumber();

		return a < b ? -1 : a > b ? 1 : 0;
	}
}

export function sortProductCode<TData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string): number {
	const codesA = parseProductCode(rowA.getValue<string>(columnId));
	const codesB = parseProductCode(rowB.getValue<string>(columnId));

	if (codesA.baseCode === codesB.baseCode) {
		if (codesA.sizeCode === codesB.sizeCode) {
			return codesA.variantCode - codesB.variantCode;
		} else {
			return codesA.sizeCode - codesB.sizeCode;
		}
	} else {
		return codesA.baseCode - codesB.baseCode;
	}
}