"use client";

import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type SortingState,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import React from 'react';
import { useRouter } from 'next/router';

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	usePagination?: boolean;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	usePagination = false
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		initialState: {
			pagination: { pageSize: 20 }
		},
		state: {
			sorting,
		},
	});

	const router = useRouter();

	function handleRowClick(rowData: TData) {
		const { id: blendId } = rowData as { id: string; };

		if (blendId) {
			void router.push(`/blends/view/${blendId}`);
		}
	}

	return (
		<div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className='cursor-pointer'
									data-state={row.getIsSelected() && "selected"}
									onClick={() => handleRowClick(row.original)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="text-center">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{usePagination ? (
				<div className="flex items-center justify-end space-x-2 py-4">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}>
						Next
					</Button>
				</div>
			) : null}
		</div>
	);
}
