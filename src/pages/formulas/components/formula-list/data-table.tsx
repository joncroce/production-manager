import React from 'react';
import { useRouter } from 'next/router';
import {
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { TFormulaListItem } from './columns';

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export function DataTable<TData, TValue>({
	columns,
	data,
}: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSubRows: (originalRow) => (originalRow as TFormulaListItem).components as TData[],
		getSortedRowModel: getSortedRowModel(),
		initialState: {
			expanded: true,
			sorting: [{
				id: 'blendCount',
				desc: true
			}, {
				id: 'proportion',
				desc: true
			}]
		},
	});

	const router = useRouter();

	function handleRowClick(rowData: TData) {
		const { id: formulaId } = rowData as { id: string; };

		if (formulaId) {
			void router.push(`/formulas/view/${formulaId}`);
		}
	}

	return (
		<div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().slice(table.getExpandedDepth() - 1).map((headerGroup) =>
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) =>
									<TableHead key={header.id}>
										{flexRender(
											header.column.columnDef.header,
											header.getContext()
										)}
									</TableHead>
								)}
							</TableRow>
						)}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className='cursor-pointer'
									onClick={() => handleRowClick(row.original)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={table.getAllFlatColumns().length} className="h-24 text-center font-bold italic text-gray-500">
									No Formulas
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}