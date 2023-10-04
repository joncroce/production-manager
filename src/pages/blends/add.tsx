import React, { useState, type ChangeEvent } from 'react';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { api } from '@/utils/api';
import { appRouter } from '@/server/api/root';
import { createInnerTRPCContext } from '@/server/api/trpc';
import superjson from '@/utils/superjson';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addBlendSchema } from '@/schemas/blend';
import { buildProductCode } from '@/utils/product';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductSelector as BlendProductSelector } from './components/product-selector';
import { useToast } from '@/components/ui/use-toast';
import BlendFormulaSelector from './components/blend-formula-selector';
import ProductCard from '../products/components/product-card';
import TankCard from '../tanks/components/tank-card';
import Link from 'next/link';
import type { z } from 'zod';
import type { NextPageWithLayout } from '../_app';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { ProductRouterOutputs } from '@/server/api/routers/product';
import type { BlendRouterOutputs } from '@/server/api/routers/blend';

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerAuthSession(context);

	return authenticatedSSProps(context)
		.then(async ({ props, redirect }) => {
			if (redirect) {
				return { props, redirect };
			}

			const helpers = createServerSideHelpers({
				router: appRouter,
				ctx: createInnerTRPCContext({ session }),
				transformer: superjson
			});

			await helpers.product.getAllBlendableProducts
				.prefetch({
					factoryId: props.user.factoryId!
				});

			return {
				props: {
					...props,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		});
};

type TBlendableProduct = ProductRouterOutputs['getAllBlendableProducts'][number];
type TFormula = NonNullable<ProductRouterOutputs['getBlendableProduct']>['Formulas'][number];
type TFormulaComponent = TFormula['Components'][number];

const AddBlend: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const [matchingBlendableProduct, setMatchingBlendableProduct] = useState<TBlendableProduct>();
	const [formulaComponents, setFormulaComponents] = useState<TFormulaComponent[]>([]);
	const [selectedFormula, setSelectedFormula] = useState<TFormula>();
	const [selectedComponentSourceTankNames, setSelectedComponentSourceTankIds] = useState<(string | undefined)[]>([]);
	const [newBlend, setNewBlend] = useState<BlendRouterOutputs['add']>();

	const factoryId = user?.factoryId;

	if (!factoryId) {
		throw new Error('No Factory found.');
	}

	const blendableProductsQuery = api.product.getAllBlendableProducts
		.useQuery({ factoryId });

	const { data: blendableProducts } = blendableProductsQuery;

	if (!blendableProducts) {
		throw new Error('Error retrieving Blendable Products');
	}

	const selectedBlendableProduct = api.product.getBlendableProduct.useQuery(
		matchingBlendableProduct!,
		{
			enabled: matchingBlendableProduct !== undefined,
			refetchOnWindowFocus: false,
			onSuccess: (data) => {
				if (data) {
					setSelectedFormulaToDefault(data.Formulas);
				}
			}
		}
	);

	const form = useForm<z.infer<typeof addBlendSchema>>({
		resolver: zodResolver(addBlendSchema),
		mode: 'onBlur',
		defaultValues: {
			factoryId,
			destinationTankName: ''
		}
	});

	form.watch(['targetQuantity', 'formulaId']);

	const { toast } = useToast();

	const addBlend = api.blend.add.useMutation({
		onSuccess(data) {
			const productCode = buildProductCode(data.baseCode, data.sizeCode, data.variantCode);
			toast({
				title: 'Successfully added new blend.',
				description: (
					<>
						<p className="font-semibold">{productCode}</p>
						<p>{data.targetQuantity.toFixed(2)} gal.</p>
					</>
				)
			});
			setNewBlend(data);
		},
		onError(error) {
			console.error(error);
			toast({
				title: 'Error adding blend!',
				description: error.message
			});
		}
	});

	function onSubmit(data: z.infer<typeof addBlendSchema>) {
		addBlend.mutate(data);
	};

	const resetForm = () => {
		form.reset();
		setMatchingBlendableProduct(undefined);
		setFormulaComponents([]);
		setSelectedFormula(undefined);
		setSelectedComponentSourceTankIds([]);
		setNewBlend(undefined);
	};

	function updateProduct(product: TBlendableProduct) {
		setMatchingBlendableProduct(product);
		form.setValue('baseCode', product.baseCode);
		form.setValue('sizeCode', product.sizeCode);
		form.setValue('variantCode', product.variantCode);
	}

	function setSelectedFormulaToDefault(formulas: TFormula[]) {
		const defaultFormula = formulas[0];
		if (defaultFormula) {
			form.setValue('formulaId', defaultFormula.id);
			setSelectedFormula(defaultFormula);

			const formulaComponents = defaultFormula.Components;
			setFormulaComponents(formulaComponents);
			setFormulaComponentsToDefaults(formulaComponents);
		}
	};

	function setFormulaComponentsToDefaults(formulaComponents?: TFormulaComponent[]) {
		if (formulaComponents) {
			const defaultComponentSourceTankIds = formulaComponents.map(
				(component) => component.Product.SourceTanks.find(
					(tank) => tank.isDefaultSource
				)?.name ?? component.Product.SourceTanks[0]?.name
			);
			setSelectedComponentSourceTankIds(defaultComponentSourceTankIds);
			defaultComponentSourceTankIds.forEach((sourceTankName, componentIndex) => {
				form.setValue(`components.${componentIndex}.sourceTankName`, sourceTankName ?? '');
			});

			formulaComponents.forEach((component, componentIndex) => {
				form.setValue(`components.${componentIndex}.baseCode`, component.baseCode);
				form.setValue(`components.${componentIndex}.sizeCode`, component.sizeCode);
				form.setValue(`components.${componentIndex}.variantCode`, component.variantCode);
				form.setValue(`components.${componentIndex}.note`, component.note ?? '');
			});

			updateComponentsTargetQuantity(formulaComponents, form.getValues('targetQuantity'));
		}
	};

	function updateSelectedFormula(offset: -1 | 1) {
		if (selectedFormula) {
			const formulas = selectedBlendableProduct.data?.Formulas;
			if (formulas?.length) {
				const selectedFormulaIndex = formulas.findIndex((formula) => formula.id === selectedFormula.id);
				const newIndex = offset === -1
					? selectedFormulaIndex - 1 < 0
						? formulas.length - 1
						: 0
					: selectedFormulaIndex + 1 >= formulas.length
						? 0
						: selectedFormulaIndex + 1;
				setSelectedFormula(formulas[newIndex]);
				form.setValue('formulaId', formulas[newIndex]?.id ?? '');
				const formulaComponents = formulas[newIndex]?.Components;
				if (formulaComponents) {
					setFormulaComponents(formulaComponents);
					setFormulaComponentsToDefaults(formulaComponents);
				}
			}
		}
	};

	function updateSelectedComponentSourceTankName(componentIndex: number, offset: 1 | -1) {
		if (selectedFormula) {
			const sourceTanks = selectedFormula.Components[componentIndex]?.Product?.SourceTanks;
			if (sourceTanks?.length) {
				setSelectedComponentSourceTankIds((prev) => {
					if (prev?.[componentIndex]) {
						const sourceTankIndex = sourceTanks.findIndex((sourceTank) => prev[componentIndex] === sourceTank.name);
						if (sourceTankIndex === -1) {
							return prev;
						}
						const newIndex =
							offset === 1
								? sourceTankIndex >= sourceTanks.length - 1
									? 0
									: sourceTankIndex + 1
								: sourceTankIndex === 0
									? sourceTanks.length - 1
									: sourceTankIndex - 1;
						const newTankName = sourceTanks[newIndex]?.name;
						form.setValue(`components.${componentIndex}.sourceTankName`, newTankName ?? '');
						return Array.from({ length: prev.length }, (_, k) => k === componentIndex ? newTankName : prev[k]);
					} else {
						return prev;
					}
				});
			}
		}
	};

	function updateComponentsTargetQuantity(formulaComponents: TFormulaComponent[], blendQuantity: number) {
		if (formulaComponents) {
			formulaComponents.forEach((component, index) => {
				form.setValue(
					`components.${index}.targetQuantity`,
					parseFloat((Number(component.proportion) * blendQuantity).toFixed(2))
				);
			});
		}
	};

	function blendQuantityChangeHandler(event: ChangeEvent<HTMLInputElement>) {
		const updatedValue = parseInt(event.target.value);
		updateComponentsTargetQuantity(formulaComponents, updatedValue);
		form.setValue('targetQuantity', updatedValue);
	};

	return (
		<>
			<Head>
				<title>Add Blend | Production Manager</title>
				<meta name="description" content="Add a new blend." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<div className="p-2 flex justify-between border-b">
				<h2 className="text-3xl font-bold">Add Blend</h2>
			</div>
			{
				newBlend
					? <div className="p-4 flex flex-col items-center space-y-6">
						<h3 className="text-3xl font-semibold">Successfully created new Blend.</h3>
						<div className="flex items-center space-x-8">
							<Link href={`/blends/view/${newBlend.id}`}><Button>Blend Details <ArrowUpRightIcon className="ml-2 stroke-white fill-black" /></Button></Link>
							<Button
								variant='outline'
								onClick={resetForm}
							>
								Add Another Blend
							</Button>
						</div>
					</div>
					: <Form {...form}>
						<form
							className="p-4 flex flex-col space-y-10"
							onSubmit={(event) => {
								event.preventDefault();
								void form.handleSubmit(onSubmit)(event);
							}}>
							<div className="flex justify-evenly items-stretch">
								<div className="flex flex-col items-center space-y-2">
									<h3 className="text-3xl font-semibold">Product</h3>
									<BlendProductSelector
										products={blendableProducts}
										currentProduct={matchingBlendableProduct}
										update={updateProduct}
									/>
									{matchingBlendableProduct
										? <ProductCard {...matchingBlendableProduct} />
										: null}
								</div>
								{selectedBlendableProduct.data
									? <>
										<div className="flex flex-col justify-between items-center space-y-6">
											<FormField
												control={form.control}
												name="targetQuantity"
												render={({ field }) => (
													<FormItem className="flex flex-col items-center space-y-2">
														<FormLabel className="text-3xl font-semibold">
															Quantity
														</FormLabel>
														<FormControl>
															<Input
																{...field}
																placeholder="Enter target quantity..."
																value={field.value}
																onChange={blendQuantityChangeHandler}
															/>
														</FormControl>
													</FormItem>
												)}
											/>

											<BlendFormulaSelector
												numberOfFormulas={selectedBlendableProduct.data.Formulas?.length ?? 0}
												selectedFormulaIndex={selectedBlendableProduct.data.Formulas?.findIndex((formula) => formula.id === selectedFormula?.id) ?? -1}
												selectPrevious={() => updateSelectedFormula(-1)}
												selectNext={() => updateSelectedFormula(1)}
												selectionDisabled={selectedBlendableProduct.data.Formulas.length < 2}
											/>
										</div>

										<FormField
											control={form.control}
											name="destinationTankName"
											render={({ field }) => {
												const selectedTank = field.value?.length
													? selectedBlendableProduct.data!.SourceTanks.find((tank) => tank.name === field.value)
													: null;

												return (

													<FormItem className="flex flex-col items-center space-y-2">
														<FormLabel className="text-3xl font-semibold">Destination Tank</FormLabel>
														<Select onValueChange={field.onChange} defaultValue={field.value}>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Destination Tank" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value={''}>(Not Specified)</SelectItem>
																{
																	selectedBlendableProduct.data!.SourceTanks.map((tank) => <SelectItem key={tank.name} value={tank.name}>{tank.name}</SelectItem>)
																}
															</SelectContent>
														</Select>
														{
															selectedTank
																? <TankCard {...selectedTank} baseCode={selectedTank.baseCode!} />
																: null
														}

													</FormItem>
												);
											}}
										/>
									</>
									: null
								}
							</div>

							{formulaComponents.length
								? <FormulaComponents
									blendTargetQuantity={form.getValues('targetQuantity') ?? 0}
									formulaComponents={formulaComponents}
									selectedComponentSourceTankNames={selectedComponentSourceTankNames}
									updateSelectedComponentSourceTankName={updateSelectedComponentSourceTankName}
								/>
								: null}

							{
								selectedBlendableProduct?.data
									? <div className="py-4 flex justify-evenly items-center">
										<Button
											variant='destructive'
											type="button"
											onClick={resetForm}
										>
											Reset
										</Button>
										<Button
											type="submit"
											disabled={!selectedBlendableProduct.data || !form.getValues('targetQuantity')}
										>
											Submit
										</Button>
									</div>
									: null
							}
						</form>
					</Form>
			}
		</>
	);
};

export default AddBlend;

AddBlend.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

function TankSelector({
	show,
	selectedTankName,
	selectPrevious,
	selectNext,
	selectionDisabled
}: {
	show: boolean;
	selectedTankName?: string;
	selectPrevious: () => void;
	selectNext: () => void;
	selectionDisabled: boolean;
}) {
	return show ? (
		<div className="flex items-center space-x-2">
			<Button
				variant='outline'
				size='icon'
				type="button"
				onClick={selectPrevious}
				disabled={selectionDisabled}
			>
				<ChevronLeftIcon className="h-4 w-4" />
			</Button>

			<span className="text-xl">
				{selectedTankName}
			</span>

			<Button
				variant='outline'
				size='icon'
				type="button"
				onClick={selectNext}
				disabled={selectionDisabled}
			>
				<ChevronRightIcon className="h-4 w-4" />
			</Button>
		</div>
	) : null;
}

function FormulaComponents(
	{
		blendTargetQuantity,
		formulaComponents,
		selectedComponentSourceTankNames,
		updateSelectedComponentSourceTankName
	}: {
		blendTargetQuantity: number;
		formulaComponents: TFormulaComponent[];
		selectedComponentSourceTankNames: (string | undefined)[];
		updateSelectedComponentSourceTankName: (componentIndex: number, offset: -1 | 1) => void;
	}): React.JSX.Element {
	const columns: Array<ColumnDef<TFormulaComponent>> = [
		{
			accessorKey: 'Product',
			header: 'Product',
			cell({ getValue }) {
				const { baseCode, sizeCode, variantCode, description } = getValue<TFormulaComponent['Product']>();
				const productCode = buildProductCode(baseCode, sizeCode, variantCode);

				return (
					<div className="flex flex-col space-y-1 text-sm">
						<p>{productCode}</p>
						<p>{description}</p>
					</div>
				);
			}
		},
		{
			header: 'Source',
			cell({ row }) {
				const index = formulaComponents.findIndex((component) => component.Product === row.original.Product);
				const sourceTankCount = row.original.Product.SourceTanks.length;

				return <TankSelector
					show={Boolean(selectedComponentSourceTankNames)}
					selectedTankName={selectedComponentSourceTankNames ? selectedComponentSourceTankNames[index] : undefined}
					selectPrevious={() => updateSelectedComponentSourceTankName(index, -1)}
					selectNext={() => updateSelectedComponentSourceTankName(index, 1)}
					selectionDisabled={sourceTankCount < 2}
				/>;
			}
		},
		{
			accessorKey: 'proportion',
			header: 'Proportion',
			cell({ getValue }) {
				const proportion = getValue<TFormulaComponent['proportion']>();

				return proportion.toFixed(3);
			}
		},
		{
			header: 'Quantity',
			cell({ row }) {
				const quantity = row.original.proportion.mul(blendTargetQuantity).toFixed(2);

				return `${quantity} gal.`;
			}
		}
	];

	const table = useReactTable({
		data: formulaComponents,
		columns,
		getCoreRowModel: getCoreRowModel()
	});

	return (
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
				{
					table.getRowModel().rows.map((row) => (
						<TableRow
							key={row.id}
						>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))
				}
			</TableBody>
		</Table>
	);
}