"use client";

import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import type { TBlendSummary } from '@/schemas/blend';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

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

export const sortableColumns: ColumnDef<TBlendSummary>[] = [
	{
		accessorKey: 'baseCode',
		header: (ctx) => sortableHeader(ctx, 'Base Code')
	},
	{
		accessorKey: 'targetQuantity',
		header: (ctx) => sortableHeader(ctx, 'Qty (Target)')
	},
	{
		accessorKey: 'actualQuantity',
		header: (ctx) => sortableHeader(ctx, 'Qty (Actual)')
	},
	{
		accessorKey: 'blendTankName',
		header: (ctx) => sortableHeader(ctx, 'Tank (Blending)')
	},
	{
		accessorKey: 'destinationTankName',
		header: (ctx) => sortableHeader(ctx, 'Tank (Destination)')
	},
	{
		accessorKey: 'status',
		header: (ctx) => sortableHeader(ctx, 'Status')
	},
	{
		accessorKey: 'createdAt',
		header: (ctx) => sortableHeader(ctx, 'Created'),
		cell({ row }) {
			return dayjs().to(row.getValue('createdAt'));
		},
	},
	{
		accessorKey: 'updatedAt',
		header: (ctx) => sortableHeader(ctx, 'Updated'),
		cell({ row }) {
			return dayjs().to(row.getValue('updatedAt'));
		},
	}
];

export const columns: ColumnDef<TBlendSummary>[] = [
	{
		accessorKey: 'baseCode',
		header: 'Base Code'
	},
	{
		accessorKey: 'targetQuantity',
		header: 'Qty (Target)'
	},
	{
		accessorKey: 'actualQuantity',
		header: 'Qty (Actual)'
	},
	{
		accessorKey: 'blendTankName',
		header: 'Tank (Blending)'
	},
	{
		accessorKey: 'destinationTankName',
		header: 'Tank (Destination)'
	},
	{
		accessorKey: 'status',
		header: 'Status'
	},
	{
		accessorKey: 'createdAt',
		header: 'Created',
		cell({ row }) {
			return dayjs().to(row.getValue('createdAt'));
		},
	},
	{
		accessorKey: 'updatedAt',
		header: 'Updated',
		cell({ row }) {
			return dayjs().to(row.getValue('updatedAt'));
		},
	}
];