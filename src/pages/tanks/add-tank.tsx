import { useState } from 'react';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { appRouter } from '@/server/api/root';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { api } from '@/utils/api';
import superjson from '@/utils/superjson';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { addTankSchema, type TAddTankSchema } from '@/schemas/tank';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { ArrowUpRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useReactTable, type ColumnDef, getCoreRowModel, flexRender } from '@tanstack/react-table';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import type { ProductBase } from '@prisma/client';
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';
import type { GetServerSideProps } from 'next';
import type { TankRouterOutputs } from '@/server/api/routers/tank';

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerAuthSession(context);

	return authenticatedSSProps(context)
		.then(async ({ props, redirect }) => {
			if (redirect) {
				return { props, redirect };
			}

			const factoryId = props.user.factoryId!;

			const helpers = createServerSideHelpers({
				router: appRouter,
				ctx: createInnerTRPCContext({ session }),
				transformer: superjson
			});

			await helpers.productBase.getAll
				.prefetch({ factoryId });

			return {
				props: {
					...props,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		});
};

const AddTankPage: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const [baseCodes, setBaseCodes] = useState<Array<ProductBase>>([]);
	const [newTank, setNewTank] = useState<TankRouterOutputs['add'] | null>(null);

	const factoryId = user.factoryId!;

	api.productBase.getAll.useQuery(
		{ factoryId },
		{
			refetchOnWindowFocus: false,
			onSuccess(data) {
				setBaseCodes(data ?? []);
			}
		});

	const form = useForm({
		mode: 'onBlur',
		resolver: zodResolver(addTankSchema),
		defaultValues: {
			factoryId,
			name: '',
			baseCode: undefined,
			sizeCode: 1,
			variantCode: 0,
			quantity: 0,
			capacity: 0,
			heel: 0,
			isDefaultSource: false,
			isBlendTank: false
		} as z.infer<typeof addTankSchema>
	});

	form.watch(['baseCode']);

	const { toast } = useToast();

	const addTank = api.tank.add.useMutation({
		onSuccess(data) {
			toast({
				variant: 'default',
				title: 'Success!',
				description: `Added ${data.isBlendTank ? 'Blend' : ''} Tank ${data.name} (${data.capacity.toNumber()}).`
			});

			setNewTank(data);
		},
		onError(error) {
			console.error(error);
			toast({
				variant: 'destructive',
				title: 'Error!',
				description: error.message
			});
		}
	});

	const submitForm: SubmitHandler<TAddTankSchema> = (data) => {
		const hasProduct = hasProductForm.getValues('hasProduct');
		const tankData = {
			...data,
			baseCode: hasProduct ? data.baseCode : undefined,
			quantity: hasProduct ? data.quantity : 0,
			isDefaultSource: hasProduct ? data.isDefaultSource : false
		};
		addTank.mutate(tankData);
	};

	function resetForm() {
		form.reset();
		hasProductForm.reset();
		if (newTank) {
			setNewTank(null);
		}
	}

	const hasProductSchema = z.object({
		hasProduct: z.boolean().default(false).optional()
	});
	const hasProductForm = useForm<z.infer<typeof hasProductSchema>>({
		resolver: zodResolver(hasProductSchema),
		defaultValues: {
			hasProduct: false
		},
	});

	hasProductForm.watch(['hasProduct']);

	return (
		<>
			<div className="flex justify-between border-b p-2">
				<h2 className="text-3xl font-bold">Add Tank</h2>
			</div>
			{
				newTank
					? <div className="flex flex-col items-center space-y-6">
						<h3 className="text-2xl font-semibold">Successfully added new tank.</h3>
						<div className="flex justify-center items-center space-x-8">
							<Link href={`/tanks/view/${newTank.name}`}>
								<Button>
									Tank Details <ArrowUpRightIcon className="ml-2 stroke-white fill-black" />
								</Button>
							</Link>
							<Button
								variant='outline'
								onClick={resetForm}
							>
								Add Another Tank
							</Button>
						</div>
					</div>
					: <Form {...form}>
						<form className="p-2 space-y-8" onSubmit={(event) => {
							event.preventDefault();
							void form.handleSubmit(submitForm)(event);
						}}>
							<FormField
								control={form.control}
								name='name'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="Enter name..." {...field} />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='capacity'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Capacity</FormLabel>
										<FormControl>
											<Input placeholder="Enter capacity in gallons..." {...field} />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='heel'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Heel</FormLabel>
										<FormControl>
											<Input placeholder="Enter heel in gallons..." {...field} />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='isBlendTank'
								render={({ field }) => (
									<FormItem className="flex flex-col justify-start items-start space-y-2">
										<FormLabel>Is this a Blend Tank?</FormLabel>
										<div className="flex justify-start items-center space-x-1">
											<span>No</span>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
											<span>Yes</span>
										</div>
									</FormItem>
								)}
							/>
							<Form {...hasProductForm}>
								<FormField
									control={hasProductForm.control}
									name='hasProduct'
									render={({ field }) => (
										<FormItem className="flex flex-col justify-start items-start space-y-2">
											<FormLabel>Does this tank contain a product?</FormLabel>
											<div className="flex justify-start items-center space-x-1">
												<span>No</span>
												<FormControl>
													<Switch checked={field.value} onCheckedChange={field.onChange} />
												</FormControl>
												<span>Yes</span>
											</div>
										</FormItem>
									)}
								/>
							</Form>
							{hasProductForm.getValues('hasProduct')
								? <>
									<TankProduct
										baseCodes={baseCodes}
										fieldValue={form.getValues('baseCode')}
										updateFieldValue={(value) => { form.setValue('baseCode', value); }}
									/>
									{form.getValues('baseCode')
										? <>
											<FormField
												control={form.control}
												name='quantity'
												render={({ field }) => (
													<FormItem>
														<FormLabel>Quantity</FormLabel>
														<FormControl>
															<Input placeholder="Enter quantity in gallons..." {...field} />
														</FormControl>
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name='isDefaultSource'
												render={({ field }) => (
													<FormItem className="flex flex-col justify-start items-start space-y-2">
														<FormLabel>Is this tank the default source for the product?</FormLabel>
														<div className="flex justify-start items-center space-x-1">
															<span>No</span>
															<FormControl>
																<Switch checked={field.value} onCheckedChange={field.onChange} />
															</FormControl>
															<span>Yes</span>
														</div>
													</FormItem>
												)}
											/>
										</>
										: null
									}
								</>
								: null
							}
							<div className="flex justify-end space-x-4">
								<AlertDialog>
									<AlertDialogTrigger>
										<Button type="button" variant='destructive'>Reset</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Confirm Form Reset</AlertDialogTitle>
											<AlertDialogDescription>
												Are you sure you want to reset the form?
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction variant='destructive' onClick={() => resetForm()}>Confirm Form Reset</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
								<Button type="submit">Submit</Button>
							</div>
						</form>
					</Form>
			}
		</>
	);
};

const TankProduct: React.FC<{
	baseCodes: Array<ProductBase>;
	fieldValue?: number;
	updateFieldValue: (value: number | undefined) => void;
}> = ({ baseCodes, fieldValue, updateFieldValue }) => {
	const [open, setOpen] = useState(false);
	const [selectedBaseCode, setSelectedBaseCode] = useState<number | undefined>(fieldValue);

	const handleClick = () => {
		updateFieldValue(selectedBaseCode);
		setOpen(false);
	};

	const columns: ColumnDef<ProductBase>[] = [
		{
			accessorKey: 'code',
			header: 'Base Code'
		},
		{
			accessorKey: 'name',
			header: 'Name',
		},
		{
			accessorKey: 'description',
			header: 'Description'
		}
	];

	const table = useReactTable({
		data: baseCodes,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	function handleRowClick(rowData: ProductBase) {
		const { code } = rowData;

		setSelectedBaseCode(code);
	}

	return (
		<>
			<div className="flex flex-col items-start space-y-2">
				<div className="flex justify-center space-x-1">
					<span className="font-bold">Selected: </span>
					<span className="font-semibold">{fieldValue ?? 'None'}</span>
				</div>
				<Dialog open={open} onOpenChange={(value) => setOpen(value)}>
					<div className="flex justify-center">
						<Button type="button" variant="outline" onClick={() => setOpen(true)}>Choose Product</Button>
					</div>

					<DialogContent>
						<DialogHeader>
							<DialogTitle>Choose Tank Product</DialogTitle>
							<DialogDescription>Tanked products are restricted to generic bulk types, so require the Base Code only.</DialogDescription>
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
													className={`cursor-pointer ${row.original.code === selectedBaseCode ? 'bg-yellow-500 hover:bg-yellow-500' : ''}`}
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
						<DialogFooter>
							<Button type="button" onClick={handleClick}>Save</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</>
	);
};

AddTankPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default AddTankPage;