import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { api } from '@/utils/api';
import { appRouter } from '@/server/api/root';
import { createInnerTRPCContext } from '@/server/api/trpc';
import superjson from '@/utils/superjson';
import { useForm, useFieldArray, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addFormulaSchema } from '@/schemas/formula';
import { buildProductCode } from '@/utils/product';
import { Form } from '@/components/ui/form';
import { ProductSelector } from '../blends/components/product-selector';
import ProductCard from '../products/components/product-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table';
import { ArrowUpRightIcon, PlusIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import type { NextPageWithLayout } from '../_app';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { ProductRouterOutputs } from '@/server/api/routers/product';
import type { FormulaRouterInputs, FormulaRouterOutputs } from '@/server/api/routers/formula';

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

			await helpers.product.getManyByCodeParts
				.prefetch({
					factoryId: props.user.factoryId!,
					sizeCode: 1,
					variantCode: 0
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

type TProduct = Omit<ProductRouterOutputs['getManyByCodeParts'][number], 'Code'>;

const schema = z.object({
	factoryId: z.string(),
	baseCode: z.string(),
	sizeCode: z.string(),
	variantCode: z.string(),
	formulaComponents: z.array(
		z.object({
			baseCode: z.string(),
			sizeCode: z.string(),
			variantCode: z.string(),
			proportion: z.string(),
			note: z.string()
		})
	)
});

const AddFormula: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const [matchingProduct, setMatchingProduct] = useState<TProduct>();
	const [matchingComponentProducts, setMatchingComponentProducts] = useState<Array<TProduct>>([]);
	const [newFormula, setNewFormula] = useState<FormulaRouterOutputs['add']>();

	const factoryId = user.factoryId!;

	if (!factoryId) {
		throw new Error('No Factory found.');
	}

	const productsQuery = api.product.getManyByCodeParts
		.useQuery(
			{ factoryId, sizeCode: 1, variantCode: 0 },
			{ refetchOnWindowFocus: false }
		);

	const { data: products } = productsQuery;

	if (!products) {
		throw new Error('Error retrieving products.');
	}

	const { toast } = useToast();

	const addFormula = api.formula.add.useMutation({
		onSuccess(data) {
			const productCode = buildProductCode(data.baseCode, data.sizeCode, data.variantCode);
			toast({
				title: 'Successfully added new blend formula.',
				description: (
					<>
						<p className="font-semibold">{productCode}</p>
					</>
				)
			});
			setNewFormula(data);
		},
		onError(error) {
			console.error(error);
			toast({
				title: 'Error adding blend!',
				description: error.message
			});
		}
	});


	const defaultFormulaComponentFormValue = {
		baseCode: '',
		sizeCode: '',
		variantCode: '',
		proportion: '',
		note: ''
	};

	const defaultFormValues: z.infer<typeof schema> = {
		factoryId,
		baseCode: '',
		sizeCode: '',
		variantCode: '',
		formulaComponents: []
	};

	const form = useForm({
		resolver: zodResolver(schema),
		mode: 'onBlur',
		defaultValues: defaultFormValues,
		resetOptions: {
			keepDefaultValues: true
		}
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'formulaComponents'
	});

	function updateProduct(product: TProduct) {
		setMatchingProduct(product);
		form.setValue('baseCode', product.baseCode.toString());
		form.setValue('sizeCode', product.sizeCode.toString());
		form.setValue('variantCode', product.variantCode.toString());
	}

	function updateComponentProduct(product: TProduct, index: number) {
		setMatchingComponentProducts(prevState =>
			prevState
				.slice(0, index)
				.concat([product])
				.concat(prevState.slice(index + 1))
		);
		form.setValue(`formulaComponents.${index}.baseCode`, product.baseCode.toString());
		form.setValue(`formulaComponents.${index}.sizeCode`, product.sizeCode.toString());
		form.setValue(`formulaComponents.${index}.variantCode`, product.variantCode.toString());
	}

	function addFormulaComponent() {
		append(defaultFormulaComponentFormValue);
	};

	function removeFormulaComponent(index: number) {
		remove(index);
		setMatchingComponentProducts(prevState => {
			const nextState = prevState.slice(0, index).concat(prevState.slice(index + 1));
			nextState.forEach((componentProduct, i) => {
				if (componentProduct) {
					form.setValue(`formulaComponents.${i}.baseCode`, componentProduct.baseCode.toString());
					form.setValue(`formulaComponents.${i}.sizeCode`, componentProduct.sizeCode.toString());
					form.setValue(`formulaComponents.${i}.variantCode`, componentProduct.variantCode.toString());
				}
			});
			return nextState;
		});
	};

	function onSubmit(data: z.infer<typeof schema>): void {
		console.log(data);

		const parsed = addFormulaSchema.safeParse(data);

		if (parsed.success) {
			const newFormula: FormulaRouterInputs['add'] = {
				factoryId,
				baseCode: parseInt(data.baseCode),
				sizeCode: parseInt(data.sizeCode),
				variantCode: parseInt(data.variantCode),
				formulaComponents: data.formulaComponents.map(
					(component) => ({
						baseCode: parseInt(component.baseCode),
						sizeCode: parseInt(component.sizeCode),
						variantCode: parseInt(component.variantCode),
						proportion: parseFloat(component.proportion),
						note: component.note.length ? component.note : undefined
					})
				)
			};

			addFormula.mutate(newFormula);
		} else {
			toast({
				title: 'Error validating formula.',
				description: parsed.error.issues.map((issue, index) => <p key={index}>{issue.message}</p>)
			});
		}
	};

	const resetForm = () => {
		form.reset();
		setMatchingProduct(undefined);
		setMatchingComponentProducts([]);
		setNewFormula(undefined);
	};

	return (
		<>
			<Head>
				<title>Add Blend Formula | Production Manager</title>
				<meta name="description" content="Add a new formula for blending." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<div className="p-2 flex justify-between border-b">
				<h2 className="text-3xl font-bold">Add Formula</h2>
			</div>

			{
				newFormula
					? <div className="p-4 flex flex-col items-center space-y-6">
						<h3 className="text-3xl font-semibold">Successfully created new Formula.</h3>
						<div className="flex items-center space-x-8">
							<Link href={`/formulas/view/${newFormula.id}`}><Button>Formula Details <ArrowUpRightIcon className="ml-2 stroke-white fill-black" /></Button></Link>
							<Button
								variant='outline'
								onClick={resetForm}
							>
								Add Another Formula
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

							<div className="flex flex-col items-center space-y-2">
								<h3 className="text-3xl font-semibold">Product</h3>
								<ProductSelector
									products={products.filter(({ sizeCode, variantCode }) => sizeCode === 1 && variantCode === 0)}
									currentProduct={matchingProduct}
									update={updateProduct}
								/>
								{matchingProduct
									? <ProductCard {...matchingProduct} />
									: null}
							</div>
							{matchingProduct
								? < div className="flex flex-col space-y-4">
									<div className="flex justify-start items-center space-x-4">
										<h3 className="text-3xl font-semibold">Formula Components</h3>
										<Button
											type='button'
											variant='outline'
											onClick={() => { addFormulaComponent(); }}
										>
											<PlusIcon className="h-4 w-4 mr-1 stroke-black fill-transparent" /> Add Component
										</Button>
									</div>
									<FormulaComponents
										register={form.register}
										matchingComponentProducts={fields.map((_, i) => ({ ...matchingComponentProducts[i], index: i }))}
										availableProducts={products}
										updateComponentProduct={updateComponentProduct}
										removeFormulaComponent={removeFormulaComponent}
									/>

									<div className="pt-12 w-full flex justify-evenly items-center">
										<Button variant='destructive' type="button" onClick={resetForm}>Reset</Button>
										<Button type="submit">Submit</Button>
									</div>
								</div>
								: null}
						</form>
					</Form >
			}
		</>
	);
};

AddFormula.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default AddFormula;

const FormulaComponents: React.FC<
	{
		register: UseFormRegister<z.infer<typeof schema>>;
		matchingComponentProducts: Array<Partial<TProduct> & { index: number; }>;
		availableProducts: Array<TProduct>;
		updateComponentProduct: (product: TProduct, index: number) => void;
		removeFormulaComponent: (componentNumber: number) => void;
	}
> = ({ register, matchingComponentProducts, availableProducts, updateComponentProduct, removeFormulaComponent }) => {
	const columns: Array<ColumnDef<Partial<TProduct> & { index: number; }>> = [
		{
			id: 'remove',
			header: '',
			cell({ row }) {
				const { index } = row.original;

				return <Button variant='destructive' type="button" onClick={() => removeFormulaComponent(index)}>Remove</Button>;
			}
		},
		{
			header: 'Code',
			cell({ row }) {
				const { baseCode, sizeCode, variantCode, index } = row.original;
				const productCode = baseCode && sizeCode
					? buildProductCode(baseCode, sizeCode, variantCode ?? 0)
					: undefined;

				return (
					<ProductSelector<TProduct>
						products={availableProducts}
						buttonText={productCode ?? 'Choose Product'}
						// @ts-expect-error non-null productCode here means the code parts are also non-null
						currentProduct={productCode ? { baseCode, sizeCode, variantCode } : null}
						update={(product) => updateComponentProduct(product, index)}
					/>
				);
			}
		},
		{
			accessorKey: 'description',
			header: 'Description',
		},
		{
			header: 'Proportion',
			cell({ row }) {
				const { index } = row.original;

				return <Input {...register(`formulaComponents.${index}.proportion`)} />;
			}
		},
		{
			header: 'Note',
			cell({ row }) {
				const { index } = row.original;

				return <Input {...register(`formulaComponents.${index}.note`)} />;
			}
		}
	];

	const table = useReactTable({
		data: matchingComponentProducts,
		columns,
		getCoreRowModel: getCoreRowModel()
	});

	return matchingComponentProducts.length ? (
		<Table className="border">
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
	) : <span className="text-red-500 font-semibold">No components.</span>;
};