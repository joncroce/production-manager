import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import type { ProductRouterOutputs } from '@/server/api/routers/product';
import { sortDecimal, sortProductCode } from '@/utils/tableSorts';

dayjs.extend(relativeTime);

export type TProductSummary =
	ProductRouterOutputs['getAll'][number]
	& {
		productCode: string;
	};

function sortableHeader(
	{ column }: HeaderContext<TProductSummary, unknown>,
	label: string
): React.JSX.Element {
	return (
		<Button
			variant='ghost'
			onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
		>
			{label}
			<ArrowUpDown className='ml-2 h-4 w-4' />
		</Button>
	);
}

export const columns: ColumnDef<TProductSummary>[] = [
	{
		accessorKey: 'productCode',
		header: (ctx) => sortableHeader(ctx, 'Code'),
		sortingFn: sortProductCode
	},
	{
		accessorKey: 'baseCode',
		header: (ctx) => sortableHeader(ctx, 'Base'),
		cell({ row, getValue }) {
			const { Code } = row.original;
			const { ProductBase } = Code;
			const baseCode = getValue<TProductSummary['baseCode']>();
			const formatted = `${ProductBase.name} (${baseCode})`;

			return (
				<span>{formatted}</span>
			);
		}
	},
	{
		accessorKey: 'sizeCode',
		header: (ctx) => sortableHeader(ctx, 'Size'),
		cell({ row, getValue }) {
			const { Code } = row.original;
			const { ProductSize } = Code;
			const sizeCode = getValue<TProductSummary['sizeCode']>();
			const formatted = `${ProductSize.name} (${sizeCode})`;

			return (
				<span>{formatted}</span>
			);
		}
	},
	{
		accessorKey: 'variantCode',
		header: (ctx) => sortableHeader(ctx, 'Variant'),
		cell({ row, getValue }) {
			const { Code } = row.original;
			const { ProductVariant } = Code;
			const variantCode = getValue<TProductSummary['variantCode']>();
			const formatted = `${ProductVariant.name} (${variantCode})`;

			return (
				<span>{formatted}</span>
			);
		}
	},
	{
		accessorKey: 'quantityInStock',
		header: (ctx) => sortableHeader(ctx, 'Qty in Stock'),
		cell({ getValue }) {
			const quantityInStock = getValue<TProductSummary['quantityInStock']>();
			const formatted = quantityInStock.toFixed(2);

			return (
				<span>{formatted}</span>
			);
		},
		sortingFn: sortDecimal
	},
	{
		accessorKey: 'salesPrice',
		header: (ctx) => sortableHeader(ctx, 'Sales Price'),
		cell({ getValue }) {
			const salesPrice = getValue<TProductSummary['salesPrice']>();
			const formatted = salesPrice?.toFixed(2) ?? 'N/A';

			return (
				<span>{formatted}</span>
			);
		},
		sortingFn: sortDecimal
	},
];