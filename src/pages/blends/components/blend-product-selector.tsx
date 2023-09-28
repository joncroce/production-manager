import React from 'react';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ProductRouterOutputs } from '@/server/api/routers/product';

type TBlendableProduct = ProductRouterOutputs['getAllBlendableProducts'][number];

export default function BlendProductSelector({
	blendableProducts,
	currentBlendableProduct,
	update
}: {
	blendableProducts: Array<TBlendableProduct>;
	currentBlendableProduct: TBlendableProduct | null;
	update: (value: TBlendableProduct) => void;
}): React.JSX.Element {
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [selectedProduct, setSelectedProduct] = React.useState<TBlendableProduct | null>(currentBlendableProduct);

	function onOpenChange(open: boolean) {
		if (open) {
			if (currentBlendableProduct !== selectedProduct) {
				setSelectedProduct(currentBlendableProduct);
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

	const columns: ColumnDef<TBlendableProduct>[] = [
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
		data: blendableProducts,
		columns,
		getCoreRowModel: getCoreRowModel()
	});

	function handleRowClick(rowData: TBlendableProduct) {
		setSelectedProduct(rowData);
	}

	return (
		<>
			<div className="flex flex-col items-center space-y-2">
				<h3 className="text-3xl font-semibold">Product</h3>

				<Dialog open={dialogOpen} onOpenChange={onOpenChange}>
					<div className="flex justify-center">
						<Button type="button" variant="outline" onClick={() => onOpenChange(true)}>{currentBlendableProduct ? 'Change' : 'Choose'} Product</Button>
					</div>

					<DialogContent>
						<DialogHeader>
							<DialogTitle>Choose Blendable Product</DialogTitle>
							<DialogDescription>Blendable products are restricted to generic bulk types, so require the Base Code only.</DialogDescription>
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
			</div>
		</>
	);
}
