import { useState } from 'react';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import { api } from '@/utils/api';
import superjson from '@/utils/superjson';
import { buildProductCode, padCodePart } from '@/utils/product';
import Layout from '@/components/Layout';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import BaseCodeCreator from './components/base-code-creator';
import SizeCodeCreator from './components/size-code-creator';
import VariantCodeCreator from './components/variant-code-creator';
import ProductCard from './components/product-card';
import { AlertTriangleIcon, InfoIcon } from 'lucide-react';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';
import type { ProductRouterInputs, ProductRouterOutputs } from '@/server/api/routers/product';
import { addProductSchema } from '@/schemas/product';
import { useToast } from '@/components/ui/use-toast';

type TProduct = ProductRouterOutputs['getManyByCodeParts'][number];

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

			await helpers.productBase.getAll
				.prefetch({
					factoryId: props.user?.factoryId ?? ''
				});

			await helpers.productSize.getAll
				.prefetch({
					factoryId: props.user?.factoryId ?? ''
				});

			await helpers.productVariant.getAll
				.prefetch({
					factoryId: props.user?.factoryId ?? ''
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

const AddProductPage: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const [newProduct, setNewProduct] = useState<TProduct>();
	const [createBaseDialogOpen, setCreateBaseDialogOpen] = useState(false);
	const [createSizeDialogOpen, setCreateSizeDialogOpen] = useState(false);
	const [createVariantDialogOpen, setCreateVariantDialogOpen] = useState(false);

	const schema = z.object({
		factoryId: z.string(),
		baseCode: z.string(),
		sizeCode: z.string(),
		variantCode: z.string(),
		description: z.string(),
		quantityInStock: z.string(),
		salesPrice: z.string()
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			factoryId: user.factoryId!,
			baseCode: '',
			sizeCode: '',
			variantCode: '',
			description: '',
			quantityInStock: '',
			salesPrice: ''
		}
	});

	function resetForm() {
		form.reset();
	}

	const { watch } = form;

	watch(['baseCode', 'sizeCode', 'variantCode']);

	const { toast } = useToast();

	function onSubmit(data: z.infer<typeof schema>): void {
		console.log(data);

		const parsed = addProductSchema.safeParse(data);

		if (parsed.success) {
			const newProduct: ProductRouterInputs['add'] = {
				...data,
				baseCode: parseInt(data.baseCode),
				sizeCode: parseInt(data.sizeCode),
				variantCode: parseInt(data.variantCode),
				quantityInStock: parseFloat(data.quantityInStock),
				salesPrice: data.salesPrice.length ? parseFloat(data.salesPrice) : undefined
			};

			addProduct.mutate(newProduct);
		}
	}

	const addProduct = api.product.add.useMutation({
		onSuccess(data) {
			toast({
				title: 'Added new Product',
				description: (
					<>
						<p className="font-semibold">{buildProductCode(data.baseCode, data.sizeCode, data.variantCode)}</p>
						<p>{data.description}</p>
						<p><span className="font-semibold">Quantity: </span>{data.quantityInStock.toFixed(2)}</p>
						<p><span className="font-semibold">Price: </span>{data.salesPrice === null ? 'N/A' : data.salesPrice.toFixed(2)}</p>
					</>
				)
			});

			setNewProduct(data);
		},
		onError(error) {
			toast({
				title: 'Error Adding Product',
				description: <span className="text-red-500">{error.message}</span>
			});
			console.error(error);
		}
	});


	function isValidCodePartString(s: string): boolean {
		if (s.length < 1 || s.length > 3) return false;
		const n = +s;
		return !(isNaN(n) || n < 0 || n > 999);
	}

	function validateCodePartInputs(codeParts: Array<'baseCode' | 'sizeCode' | 'variantCode'>) {
		return codeParts.every((codePart) => isValidCodePartString(form.getValues(codePart)));
	}

	const productOfSelectedCodeParts = api.product.getByCode
		.useQuery({
			factoryId: user.factoryId!,
			baseCode: parseInt(form.getValues('baseCode')),
			sizeCode: parseInt(form.getValues('sizeCode')),
			variantCode: parseInt(form.getValues('variantCode')),
		}, {
			enabled: user.factoryId !== undefined
				&& validateCodePartInputs(['baseCode', 'sizeCode', 'variantCode']),
			refetchOnWindowFocus: false
		});

	const productsOfBaseAndSizeQuery = api.product.getManyByCodeParts
		.useQuery({
			factoryId: user.factoryId!,
			baseCode: parseInt(form.getValues('baseCode')),
			sizeCode: parseInt(form.getValues('sizeCode')),
		}, {
			enabled: user.factoryId !== undefined
				&& validateCodePartInputs(['baseCode', 'sizeCode']),
			refetchOnWindowFocus: false
		});

	const productsOfBaseAndVariantQuery = api.product.getManyByCodeParts
		.useQuery({
			factoryId: user.factoryId!,
			baseCode: parseInt(form.getValues('baseCode')),
			variantCode: parseInt(form.getValues('variantCode')),
		}, {
			enabled: user.factoryId !== undefined
				&& validateCodePartInputs(['baseCode', 'variantCode']),
			refetchOnWindowFocus: false
		});

	const productsOfSizeAndVariantQuery = api.product.getManyByCodeParts
		.useQuery({
			factoryId: user.factoryId!,
			sizeCode: parseInt(form.getValues('sizeCode')),
			variantCode: parseInt(form.getValues('variantCode')),
		}, {
			enabled: user.factoryId !== undefined
				&& validateCodePartInputs(['sizeCode', 'variantCode']),
			refetchOnWindowFocus: false
		});

	const baseCodesQuery = api.productBase.getAll
		.useQuery({
			factoryId: user.factoryId!
		}, {
			enabled: user.factoryId !== undefined
		});

	const sizeCodesQuery = api.productSize.getAll
		.useQuery({
			factoryId: user.factoryId!
		}, {
			enabled: user.factoryId !== undefined
		});

	const variantCodesQuery = api.productVariant.getAll
		.useQuery({
			factoryId: user.factoryId!
		}, {
			enabled: user.factoryId !== undefined
		});

	const { data: baseCodes } = baseCodesQuery;
	const { data: sizeCodes } = sizeCodesQuery;
	const { data: variantCodes } = variantCodesQuery;

	const baseNameByCode = mapCodePartNameToCode(baseCodes ?? []);
	const sizeNameByCode = mapCodePartNameToCode(sizeCodes ?? []);
	const variantNameByCode = mapCodePartNameToCode(variantCodes ?? []);

	function mapCodePartNameToCode(codeParts: Array<{ code: number; name: string; }>): Map<string, string> {
		return codeParts.reduce((map, codePart) => {
			map.set(padCodePart(codePart.code), codePart.name);

			return map;
		}, new Map<string, string>());
	}

	function productsToCodePartSet(
		products: Array<TProduct>,
		codePartName: 'baseCode' | 'sizeCode' | 'variantCode'
	): Set<string> {
		const set = new Set<string>();

		for (const product of products) {
			set.add(padCodePart(product[codePartName]));
		}

		return set;
	}

	return (
		<>
			<div className="flex justify-between border-b p-2">
				<h2 className="text-3xl font-bold">Add Product</h2>
			</div>

			{newProduct
				? <div className="p-4 flex flex-col items-center space-y-10">
					<h3 className="font-semibold text-2xl">Successfully Created New Product</h3>
					<ProductCard {...newProduct} />
					<Button
						className="text-xl"
						variant='outline'
						onClick={() => {
							resetForm();
							setNewProduct(undefined);
						}}
					>
						Add Another Product
					</Button>
				</div>
				: <Form {...form}>
					<form
						className="p-4 flex flex-col space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							void form.handleSubmit(onSubmit)(event);
						}}>
						<div className="flex justify-between items-end text-2xl">
							<FormField
								control={form.control}
								name="baseCode"
								render={({ field }) => {
									const existingProductWithCode = productsToCodePartSet(productsOfSizeAndVariantQuery.data ?? [], 'baseCode');
									return (
										<FormItem className="w-1/2">
											<FormLabel className="p-1">Product Base</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger>
														<SelectValue>
															{!field.value.length
																? 'Select Product Base...'
																: <span>{field.value}: {baseNameByCode.get(field.value)!}</span>
															}
														</SelectValue>
													</SelectTrigger>
													<SelectContent className="max-h-60">
														<ScrollArea>
															{
																[...baseNameByCode.entries()]
																	.map(([code, name]) =>
																		<SelectItem
																			className="data-[exists=true]:underline"
																			key={code}
																			value={code}
																			data-exists={existingProductWithCode.has(code)}
																		>
																			{code}: {name}
																		</SelectItem>
																	)
															}
														</ScrollArea>
													</SelectContent>
												</Select>
											</FormControl>
										</FormItem>
									);
								}}
							/>

							<Dialog open={createBaseDialogOpen} onOpenChange={setCreateBaseDialogOpen}>
								<DialogTrigger asChild>
									<Button variant='outline'>Create New Product Base</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Create New Product Base</DialogTitle>
										<DialogDescription>Create a new product base from which products can be built in combination with sizes and variants.</DialogDescription>
									</DialogHeader>
									<BaseCodeCreator
										factoryId={user?.factoryId ?? ''}
										setSelectedBaseCode={(v) => form.setValue('baseCode', padCodePart(v))}
										close={() => setCreateBaseDialogOpen(false)}
									/>
								</DialogContent>
							</Dialog>
						</div>

						<div className="flex justify-between items-end text-2xl">
							<FormField
								control={form.control}
								name="sizeCode"
								render={({ field }) => {
									const existingProductWithCode = productsToCodePartSet(productsOfBaseAndVariantQuery.data ?? [], 'sizeCode');
									return (
										<FormItem className="w-1/2">
											<FormLabel className="p-1">Product Size</FormLabel>
											<FormControl>
												<Select
													value={field.value.length ? field.value : undefined}
													onValueChange={field.onChange}
												>
													<SelectTrigger><SelectValue>
														{!field.value.length
															? 'Select Product Size...'
															: <span>{field.value}: {sizeNameByCode.get(field.value)!}</span>
														}
													</SelectValue>
													</SelectTrigger>
													<SelectContent className="max-h-60">
														<ScrollArea>
															{
																[...sizeNameByCode.entries()]
																	.map(([code, name]) =>
																		<SelectItem
																			className="data-[exists=true]:underline"
																			key={code}
																			value={code}
																			data-exists={existingProductWithCode.has(code)}
																		>
																			{code}: {name}
																		</SelectItem>
																	)
															}
														</ScrollArea>
													</SelectContent>
												</Select>
											</FormControl>
										</FormItem>
									);
								}}
							/>

							<Dialog open={createSizeDialogOpen} onOpenChange={setCreateSizeDialogOpen}>
								<DialogTrigger asChild>
									<Button variant='outline'>Create New Product Size</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Create New Product Size</DialogTitle>
										<DialogDescription>Create a new product size from which products can be built in combination with bases and variants.</DialogDescription>
									</DialogHeader>
									<SizeCodeCreator
										factoryId={user?.factoryId ?? ''}
										setSelectedSizeCode={(v) => form.setValue('sizeCode', padCodePart(v))}
										close={() => setCreateSizeDialogOpen(false)}
									/>
								</DialogContent>
							</Dialog>
						</div>

						<div className="flex justify-between items-end text-2xl">
							<FormField
								control={form.control}
								name="variantCode"
								render={({ field }) => {
									const existingProductWithCode = productsToCodePartSet(productsOfBaseAndSizeQuery.data ?? [], 'variantCode');
									return (
										<FormItem className="w-1/2">
											<FormLabel className="p-1">Product Variant</FormLabel>
											<FormControl>
												<Select
													value={field.value.length ? field.value : undefined}
													onValueChange={field.onChange}
												>
													<SelectTrigger>													<SelectValue>
														{!field.value.length
															? 'Select Product Variant...'
															: <span>{field.value}: {variantNameByCode.get(field.value)!}</span>
														}
													</SelectValue>
													</SelectTrigger>
													<SelectContent className="max-h-60">
														<ScrollArea>
															{
																[...variantNameByCode.entries()]
																	.map(([code, name]) =>
																		<SelectItem
																			className="data-[exists=true]:underline"
																			key={code}
																			value={code}
																			data-exists={existingProductWithCode.has(code)}
																		>
																			{code}: {name}
																		</SelectItem>
																	)
															}
														</ScrollArea>
													</SelectContent>
												</Select>
											</FormControl>
										</FormItem>
									);
								}}
							/>

							<Dialog open={createVariantDialogOpen} onOpenChange={setCreateVariantDialogOpen}>
								<DialogTrigger asChild>
									<Button variant='outline'>Create New Product Variant</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Create New Product Variant</DialogTitle>
										<DialogDescription>Create a new product variant from which products can be built in combination with bases and sizes.</DialogDescription>
									</DialogHeader>
									<VariantCodeCreator
										factoryId={user?.factoryId ?? ''}
										setSelectedVariantCode={(v) => form.setValue('variantCode', padCodePart(v))}
										close={() => setCreateVariantDialogOpen(false)}
									/>
								</DialogContent>
							</Dialog>
						</div>

						{productOfSelectedCodeParts.data
							? <div className="py-4 flex flex-col space-y-2 items-start">
								<span className="flex items-center font-semibold text-xl text-red-500">
									<AlertTriangleIcon className="mr-1 stroke-white fill-red-500" />
									Product exists.
								</span>
								<ProductCard {...productOfSelectedCodeParts.data} />
							</div>
							: null
						}

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="p-1">Description</FormLabel>
									<FormControl>
										<Input placeholder="Enter product description..." {...field} />
									</FormControl>
								</FormItem>
							)}
						/>


						<div className="flex justify-between space-x-8 text-2xl">
							<FormField
								control={form.control}
								name="quantityInStock"
								render={({ field }) => (
									<FormItem className="grow">
										<FormLabel className="p-1 flex items-center">
											<span className="mr-1">Quantity in stock</span>
											<TooltipProvider>
												<Tooltip delayDuration={0}>
													<TooltipTrigger>
														<InfoIcon className="w-4 h-4 stroke-gray-700 fill-transparent" />
													</TooltipTrigger>
													<TooltipContent>
														<p><span className="font-semibold">(Optional)</span> Default quantity in stock is 0.</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</FormLabel>
										<FormControl>
											<Input placeholder="Enter quantity (default is 0)..." {...field} value={field.value ?? undefined} />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="salesPrice"
								render={({ field }) => (
									<FormItem className="grow">
										<FormLabel className="p-1 flex items-center">
											<span className="mr-1">Sales Price</span>
											<TooltipProvider>
												<Tooltip delayDuration={0}>
													<TooltipTrigger>
														<InfoIcon className="w-4 h-4 stroke-gray-700 fill-transparent" />
													</TooltipTrigger>
													<TooltipContent>
														<p><span className="font-semibold">(Optional)</span> There will be no default sales price set.</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</FormLabel>
										<FormControl>
											<Input placeholder="Enter price (optional)..." {...field} value={field.value ?? undefined} />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
						<div className="flex justify-between align-center pt-6">
							<Button type="button" variant='destructive' onClick={resetForm}>Reset</Button>
							<Button type="submit" disabled={Boolean(productOfSelectedCodeParts.data)}>Save</Button>
						</div>
					</form>
				</Form>
			}
		</>
	);
};

AddProductPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default AddProductPage;