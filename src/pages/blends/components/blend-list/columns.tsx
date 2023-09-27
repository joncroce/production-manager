"use client";

import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { sortDecimal } from '@/utils/tableSorts';
import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import type { BlendRouterOutputs } from '@/server/api/routers/blend';
import { buildProductCode } from '@/utils/product';
import Link from 'next/link';


dayjs.extend(relativeTime);

export type TBlendSummary = BlendRouterOutputs['getAll'][number];

function sortableHeader(
	{ column }: HeaderContext<TBlendSummary, unknown>,
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

export const columns: ColumnDef<TBlendSummary>[] = [
	{
		accessorKey: 'baseCode',
		header: (ctx) => sortableHeader(ctx, 'Base Code'),
		cell({ getValue }): React.JSX.Element {
			const baseCode = getValue<TBlendSummary['baseCode']>();
			const productCode = buildProductCode(baseCode, 1, 0);

			return (
				<Link className="underline" href={`/products/view/${productCode}`} onClick={(e) => e.stopPropagation()}>{productCode}</Link>
			);
		}
	},
	{
		accessorKey: 'targetQuantity',
		header: (ctx) => sortableHeader(ctx, 'Qty (Target)'),
		cell({ getValue }) {
			return getValue<TBlendSummary['targetQuantity']>().toFixed(2);
		},
		sortingFn: sortDecimal,
	},
	{
		accessorKey: 'actualQuantity',
		header: (ctx) => sortableHeader(ctx, 'Qty (Actual)'),
		cell({ getValue }) {
			return getValue<TBlendSummary['actualQuantity']>()?.toFixed(2) ?? '';
		},
		sortingFn: sortDecimal,
	},
	{
		accessorKey: 'blendTankName',
		header: (ctx) => sortableHeader(ctx, 'Tank (Blending)'),
		cell({ getValue }): React.JSX.Element {
			const blendTankName = getValue<TBlendSummary['blendTankName']>();

			return (
				<Link className="underline" href={`/tanks/view/${blendTankName}`} onClick={(e) => e.stopPropagation()}>{blendTankName}</Link>
			);
		}
	},
	{
		accessorKey: 'destinationTankName',
		header: (ctx) => sortableHeader(ctx, 'Tank (Destination)'),
		cell({ getValue }): React.JSX.Element {
			const destinationTankName = getValue<TBlendSummary['destinationTankName']>();

			return (
				<Link className="underline" href={`/tanks/view/${destinationTankName}`} onClick={(e) => e.stopPropagation()}>{destinationTankName}</Link>
			);
		}
	},
	{
		accessorKey: 'status',
		header: (ctx) => sortableHeader(ctx, 'Status')
	},
	{
		accessorKey: 'createdAt',
		header: (ctx) => sortableHeader(ctx, 'Created'),
		cell({ getValue }) {
			return dayjs().to(getValue<Date>());
		},
	},
	{
		accessorKey: 'updatedAt',
		header: (ctx) => sortableHeader(ctx, 'Updated'),
		cell({ getValue }) {
			return dayjs().to(getValue<Date>());
		},
	}
];