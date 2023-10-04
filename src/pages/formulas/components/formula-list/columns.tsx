import type { ColumnDef } from '@tanstack/react-table';
import type { Prisma } from '@prisma/client';
import React from 'react';
import Link from 'next/link';

export type TFormulaListItem = {
	id: string;
	targetProductCode: string;
	blendCount: number;
	components: Array<{
		componentProductCode: string;
		proportion: Prisma.Decimal;
	}>;
};

export const columns: ColumnDef<TFormulaListItem>[] = [
	{
		accessorKey: 'targetProductCode',
		header: 'Target Code',
		cell({ getValue }) {
			const productCode = getValue<TFormulaListItem['targetProductCode']>();

			if (productCode) {
				return <Link className="underline" href={`/products/view/${productCode}`} onClick={(e) => e.stopPropagation()}>{productCode}</Link>;
			}
		}
	},
	{
		accessorKey: 'blendCount',
		header: 'Blends',
	},
	{
		accessorFn: row => row.components,
		id: 'Components',
		header: undefined,
		columns: [
			{
				header: 'Component Code',
				accessorKey: 'componentProductCode',
				cell({ getValue }) {
					const productCode = getValue<TFormulaListItem['components'][number]['componentProductCode']>();

					if (productCode) {
						return <Link className="underline" href={`/products/view/${productCode}`} onClick={(e) => e.stopPropagation()}>{productCode}</Link>;
					}
				}
			},
			{
				header: 'Proportion',
				accessorKey: 'proportion',
				cell({ getValue }) {
					const proportion = getValue<TFormulaListItem['components'][number]['proportion']>();

					if (proportion) {
						return <span>{proportion.toFixed(2)}</span>;
					}
				}
			}
		]
	},
];