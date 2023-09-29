import React from 'react';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ProductSelector<T extends {
	baseCode: number;
	sizeCode: number;
	variantCode: number;
}>({
	buttonText,
	products,
	currentProduct,
	update
}: {
	buttonText?: string;
	products: Array<T>;
	currentProduct: T | null;
	update: (value: T) => void;
}): React.JSX.Element {
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [selectedProduct, setSelectedProduct] = React.useState<T | null>(currentProduct);

	function onOpenChange(open: boolean) {
		if (open) {
			if (currentProduct !== selectedProduct) {
				setSelectedProduct(currentProduct);
			}
			setDialogOpen(true);
		} else {
			setDialogOpen(false);
		}
	}

	function save() {
		if (selectedProduct) {
			update(selectedProduct);
			onOpenChange(false);
		}
	}

	const columns: ColumnDef<T>[] = [
		{
			accessorKey: 'baseCode',
			header: 'Base Code'
		},
		{
			accessorKey: 'description',
			header: 'Description'
		}
	];

	const table = useReactTable({
		data: products,
		columns,
		getCoreRowModel: getCoreRowModel()
	});

	function handleRowClick(rowData: T) {
		setSelectedProduct(rowData);
	}

	return (
		<Dialog open={dialogOpen} onOpenChange={onOpenChange}>
			<Button type="button" variant="outline" onClick={() => onOpenChange(true)}>{
				buttonText
					? buttonText
					: currentProduct
						? 'Change Product'
						: 'Choose Product'
			}</Button>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Choose Product</DialogTitle>
				</DialogHeader>
				<div className="rounded-md border">
					<ScrollArea className="h-[600px]">
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
											className="cursor-pointer data-[selected=true]:bg-yellow-500 hover:bg-yellow-300"
											onClick={() => handleRowClick(row.original)}
											data-selected={selectedProduct && row.original.baseCode === selectedProduct.baseCode}
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
										<TableCell colSpan={columns.length} className="h-24 text-center">
											No results.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</ScrollArea>
				</div>
				<DialogFooter>
					<Button type="button" onClick={save}>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
