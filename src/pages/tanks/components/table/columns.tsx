"use client";

import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import type { TankRouterOutputs } from '@/server/api/routers/tank';

dayjs.extend(relativeTime);

type TTankSummary = TankRouterOutputs['getAll'][number];

function sortableHeader(
	{ column }: HeaderContext<TTankSummary, unknown>,
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

export const columns: ColumnDef<TTankSummary>[] = [
	{
		accessorKey: 'name',
		header: (ctx) => sortableHeader(ctx, 'Name')
	},
	{
		accessorKey: 'baseCode',
		header: (ctx) => sortableHeader(ctx, 'Base Code')
	},
	{
		accessorKey: 'quantity',
		header: (ctx) => sortableHeader(ctx, 'Quantity')
	},
	{
		accessorKey: 'capacity',
		header: (ctx) => sortableHeader(ctx, 'Capacity')
	},
	{
		accessorKey: 'isBlendTank',
		header: (ctx) => sortableHeader(ctx, 'Blend Tank'),
		cell({ getValue }) {
			const isBlendTank = getValue<boolean>();

			return <span>{isBlendTank ? 'Yes' : 'No'}</span>;
		}
	},
	{
		accessorKey: 'updatedAt',
		header: (ctx) => sortableHeader(ctx, 'Updated'),
		cell({ getValue }) {
			return dayjs().to(getValue<Date>());
		},
	}
];