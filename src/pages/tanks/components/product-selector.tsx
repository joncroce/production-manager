import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertOctagonIcon, Edit2Icon } from 'lucide-react';
import type { ProductRouterOutputs } from '@/server/api/routers/product';

export type TankableProduct = ProductRouterOutputs['getAllTankableProducts'][number];

export function ProductSelector({
	factoryId,
	tankName,
	currentProduct
}: {
	factoryId: string;
	tankName: string;
	currentProduct: TankableProduct | null;
}): React.JSX.Element {
	const [open, setOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<TankableProduct | null>(currentProduct);
	const [showWarning, setShowWarning] = useState(false);
	const [showRemoveProductConfirmation, setShowRemoveProductConfirmation] = useState(false);
	const utils = api.useContext();
	const { toast } = useToast();

	const products = api.product.getAllTankableProducts.useQuery(
		{ factoryId },
		{
			refetchOnWindowFocus: false,
		}
	);

	const mutation = api.tank.updateTankProduct.useMutation({
		onSuccess(data) {
			setSelectedProduct(data.Product);

			toast({
				title: `${data.Product ? 'Updated' : 'Removed'} Tank Product`,
				description: data.Product ? (
					<div className="flex flex-col items-start">
						<span className="font-bold">{data.Product.baseCode}</span>
						<span>{data.Product.description}</span>
					</div>
				) : '',
			});

			utils.tank.getTankByName
				.invalidate({ factoryId, name: tankName })
				.then(() => { console.log('Invalidated tank query.'); })
				.catch((error) => { console.error(error); });

			setOpen(false);
			setShowRemoveProductConfirmation(false);
		},
		onError(error) {
			toast({
				title: 'Error updating Tank Product!',
				description: error.message
			});
			console.error(error);
		}
	});

	function onOpenChange(open: boolean) {
		if (open) {
			setOpen(open);
		} else if (selectedProduct?.baseCode !== currentProduct?.baseCode) {
			setShowWarning(true);
		} else {
			setSelectedProduct(currentProduct);
			setOpen(false);
		}
	}

	function removeProduct() {
		mutation.mutate({
			factoryId,
			name: tankName,
		});
	}

	const handleSave = () => {
		if (selectedProduct?.baseCode !== currentProduct?.baseCode) {
			mutation.mutate({
				factoryId,
				name: tankName,
				productBaseCode: selectedProduct?.baseCode
			});
		} else {
			console.log('Tank Product unchanged.');
			setOpen(false);
		}
	};

	const columns: ColumnDef<TankableProduct>[] = [
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
		data: products?.data ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	function handleRowClick(rowData: TankableProduct) {
		setSelectedProduct(rowData);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<Button type="button" variant="ghost" onClick={() => setOpen(true)}><Edit2Icon /></Button>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Choose Tank Product</DialogTitle>
					<DialogDescription>Tanked products are restricted to generic bulk types.</DialogDescription>
				</DialogHeader>
				{showWarning ? (
					<>
						<div className="flex justify-start items-stretch space-x-2">
							<AlertOctagonIcon className="stroke-white text-red-500" />
							<span className="font-semibold">Tank Product has unsaved changes!</span>
						</div>
						<p>
							Press <span className="font-semibold">Cancel</span> to return to selecting the Tank Product, or <span className="font-semibold">Confirm</span> to discard changes.
						</p>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowWarning(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => {
									setShowWarning(false);
									setOpen(false);
									setSelectedProduct(currentProduct);
								}}
							>
								Confirm
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
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
													className={`cursor-pointer ${row.original.baseCode === selectedProduct?.baseCode ? 'bg-yellow-500 hover:bg-yellow-500' : ''}`}
													data-state={row.getIsSelected() && "selected"}
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
												<TableCell colSpan={columns.length} className="h-24 text-center">
													No results.
												</TableCell>
											</TableRow>
										)}
									</TableBody>

								</Table>
							</ScrollArea>
						</div>
						<DialogFooter className="sm:justify-between">
							{showRemoveProductConfirmation ? (
								<div className="w-full flex flex-col items-between space-y-1">
									<span className="font-semibold">Are you sure you want to remove the current product?</span>
									<div className="flex justify-between">
										<Button
											type='button'
											variant='outline'
											onClick={() => setShowRemoveProductConfirmation(false)}
										>
											Cancel
										</Button>
										<Button
											type='button'
											variant='destructive'
											onClick={() => { removeProduct(); }}
										>Yes, Remove Product
										</Button>
									</div>
								</div>
							) : (<>
								{currentProduct ? (
									<Button
										className="justify-self-start"
										type='button'
										variant='destructive'
										onClick={() => { setShowRemoveProductConfirmation(true); }}
									>
										Remove Product
									</Button>
								) : (
									<span />
								)}
								<div className="flex justify-self-end justify-end space-x-2">
									<Button
										className="justify-self-end"
										type="button"
										variant={selectedProduct?.baseCode !== currentProduct?.baseCode ? 'destructive' : 'outline'}
										onClick={() => setOpen(false)}
									>
										Cancel
									</Button>
									<Button type="button" onClick={handleSave}>Save</Button>
								</div>
							</>)}
						</DialogFooter>
					</>)}
			</DialogContent>
		</Dialog>
	);

}