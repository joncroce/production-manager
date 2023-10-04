import { createServerSideHelpers } from '@trpc/react-query/server';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import { redirect } from 'next/navigation';
import { buildProductCode, parseProductCode } from '@/utils/product';
import { api } from '@/utils/api';
import superjson from '@/utils/superjson';
import { useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import Timestamp from '@/components/Timestamp';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertOctagonIcon, AlertTriangleIcon, Edit2Icon } from 'lucide-react';
import { columns as tankColumns } from '@/pages/tanks/components/table/columns';
import { DataTable as TankDataTable } from '@/pages/tanks/components/table/data-table';
import { columns as blendColumns } from '@/pages/blends/components/blend-list/columns';
import { DataTable as BlendDataTable } from '@/pages/blends/components/blend-list/data-table';
import { columns as formulaColumns, type TFormulaListItem } from '@/pages/formulas/components/formula-list/columns';
import { DataTable as FormulaDataTable } from '@/pages/formulas/components/formula-list/data-table';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../../_app';
import type { ProductRouterOutputs } from '@/server/api/routers/product';

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerAuthSession(context);

	return authenticatedSSProps(context)
		.then(async ({ props, redirect }) => {
			if (redirect) {
				return { props, redirect };
			}

			if (typeof context.params?.code !== 'string') {
				return { props, redirect: { destination: '/404', permanent: false } };
			} else {

				const helpers = createServerSideHelpers({
					router: appRouter,
					ctx: createInnerTRPCContext({ session }),
					transformer: superjson
				});

				try {
					const productCode = context.params.code;

					await helpers.product.getByCode
						.prefetch({
							factoryId: props.user?.factoryId ?? '',
							productCode
						});

					return {
						props: {
							...props,
							productCode,
							trpcState: helpers.dehydrate()
						},
						redirect
					};
				} catch (err) {
					console.error(err);

					return { props, redirect: { destination: '/400', permanent: false } };
				}

			}
		});
};

const ViewProductPage: NextPageWithLayout<{ user: Session['user']; productCode: string; }> = ({ user, productCode }) => {
	const [inEditMode, setInEditMode] = useState(false);

	const factoryId = user?.factoryId;

	if (!factoryId) {
		redirect('/onboard');
	}

	const { sizeCode } = parseProductCode(productCode);

	const productQuery = api.product.getByCode
		.useQuery({
			factoryId,
			productCode
		});

	const { data: product } = productQuery;

	if (!product) {
		throw new Error('Error retrieving product data.');
	}

	type TBlend = typeof product.Blends[number];
	const blendsAsTarget: Array<TBlend> = product.Blends;
	const blendsAsComponent: Array<TBlend> = Array.from(
		product.BlendComponents.reduce((blendSet, component) => {
			return blendSet.add(component.Blend);
		}, new Set<TBlend>())
	);

	function mapFormulaToListItem(formula: NonNullable<ProductRouterOutputs['getByCode']>['Formulas'][number]): TFormulaListItem {
		const { baseCode, sizeCode, variantCode } = formula;
		const targetProductCode = buildProductCode(baseCode, sizeCode, variantCode);

		return {
			id: formula.id,
			targetProductCode,
			blendCount: formula._count.Blends,
			components: formula.Components.map((component) => {
				const { baseCode, sizeCode, variantCode } = component;
				const componentProductCode = buildProductCode(baseCode, sizeCode, variantCode);

				return {
					componentProductCode,
					proportion: component.proportion
				};
			})
		};
	}

	const formulasAsTarget = product.Formulas
		.map(mapFormulaToListItem);

	const formulasAsComponent = product.FormulaComponents
		.map((component) => mapFormulaToListItem(component.Formula));

	return (
		<>
			<div className="p-2 grid grid-cols-3 border-b">
				<h2 className="col-span-1 text-3xl font-bold">Product Details</h2>
				<div className="col-span-1 flex justify-center items-end space-x-1">
					<span className="text-2xl font-semibold">Code: </span>
					<span className="text-2xl font-bold">{productCode}</span>
				</div>
				<div className="col-span-1 flex justify-end">
					{
						inEditMode
							? <Button variant='default' onClick={() => setInEditMode(false)}>Switch to View Mode</Button>
							: <Button variant='destructive' onClick={() => setInEditMode(true)}>Switch to Edit Mode</Button>
					}
				</div>
			</div>
			<div className="flex justify-center items-baseline space-x-4">
				<Timestamp time={product.updatedAt} label="Updated" />
			</div>

			<div className="py-6">
				<div className="p-4 flex justify-evenly">
					<ProductDescription
						inEditMode={inEditMode}
						factoryId={factoryId}
						productCode={productCode}
						currentDescription={product.description}
					/>
					<ProductQuantity
						inEditMode={inEditMode}
						factoryId={factoryId}
						productCode={productCode}
						currentQuantity={product.quantityInStock}
					/>
					<ProductPrice
						inEditMode={inEditMode}
						factoryId={factoryId}
						productCode={productCode}
						currentPrice={product.salesPrice}
					/>
				</div>
			</div>

			{
				sizeCode === 1
					? <div className="p-4">
						<h3 className="py-4 font-semibold text-2xl">Related Tanks</h3>
						<TankDataTable columns={tankColumns} data={product.SourceTanks} />
					</div>
					: null
			}

			<div className="p-4">
				<h3 className="py-4 font-semibold text-2xl">Related Blends</h3>
				<Tabs defaultValue={sizeCode === 1 ? 'target' : 'component'}>
					<TabsList>
						{
							sizeCode === 1
								? <TabsTrigger value="target">As Target</TabsTrigger>
								: null
						}
						<TabsTrigger value="component">As Component</TabsTrigger>
					</TabsList>
					{
						sizeCode === 1
							? <TabsContent value="target">
								<BlendDataTable columns={blendColumns} data={blendsAsTarget} usePagination={true} />
							</TabsContent>
							: null
					}
					<TabsContent value="component">
						<BlendDataTable columns={blendColumns} data={blendsAsComponent} usePagination={true} />
					</TabsContent>
				</Tabs>
			</div>

			<div className="p-4">
				<h3 className="py-4 font-semibold text-2xl">Related Formulas</h3>
				<Tabs defaultValue={sizeCode === 1 ? 'target' : 'component'}>
					<TabsList>
						{
							sizeCode === 1
								? <TabsTrigger value="target">As Target</TabsTrigger>
								: null
						}
						<TabsTrigger value="component">As Component</TabsTrigger>
					</TabsList>
					{
						sizeCode === 1
							? <TabsContent value="target">
								<FormulaDataTable
									columns={formulaColumns}
									data={formulasAsTarget}
								/>
							</TabsContent>
							: null
					}
					<TabsContent value="component">
						<FormulaDataTable
							columns={formulaColumns}
							data={formulasAsComponent}
						/>
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
};

ViewProductPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default ViewProductPage;

function ProductDescription({
	inEditMode,
	factoryId,
	productCode,
	currentDescription
}: {
	inEditMode: boolean;
	factoryId: string;
	productCode: string;
	currentDescription: string;
}): React.JSX.Element {
	const initialValue = currentDescription;
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(initialValue);
	const [inputValid, setInputValid] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showWarning, setShowWarning] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const utils = api.useContext();
	const { toast } = useToast();

	const mutation = api.product.updateDescription.useMutation({
		onSuccess(data) {
			const updatedValue = data.description;
			setValue(updatedValue);

			toast({
				title: 'Updated Product Description',
				description: <span className="font-semibold">{updatedValue}</span>
			});

			utils.product.getByCode.invalidate({ factoryId, productCode })
				.then(() => {
					console.log('Invalidated product query.');
				}).catch((error) => {
					console.error(error);
				});

			setInputValid(true);
			setErrorMessage(null);
			setOpen(false);
		},
		onError(error) {
			toast({
				title: 'You attempted to set an invalid product description!',
				description: error.message
			});
			console.error(error);

			setInputValid(false);
			setErrorMessage(error.message);
		}
	});

	function saveDescription() {
		if (inputRef.current) {
			const inputValue = inputRef.current.value.trim();

			if (inputValue !== initialValue) {
				const updatedValue = inputValue;
				const schema = z.string();
				const parsed = schema.safeParse(updatedValue);

				if (parsed.success) {
					mutation.mutate({
						factoryId,
						productCode,
						description: updatedValue
					});
				} else {
					setInputValid(false);
					const error = parsed.error;
					const message = error.issues.map((issue) => issue.message).join('\n');
					setErrorMessage(message);
					toast({
						title: 'You attempted to set an invalid product description!',
						description: message
					});
					inputRef.current.focus();
				}
			} else {
				console.log('Product description was unchanged.');
				setInputValid(true);
				setErrorMessage(null);
				setOpen(false);
			}
		}
	}

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined = (event) => {
		if (inputRef.current) {
			if (event.key === 'Enter') {
				saveDescription();
			} else if (event.key === 'Escape') {
				inputRef.current.value = initialValue;
				setValue(initialValue);
				setInputValid(true);
				setErrorMessage(null);
			}
		}
	};

	function onOpenChange(open: boolean) {
		if (open) {
			setOpen(open);
		} else if (value.trim() !== initialValue) {
			setShowWarning(true);
		} else {
			reset();
		}
	}

	function reset() {
		setValue(initialValue);
		if (inputRef.current) inputRef.current.value = initialValue;
		setOpen(false);
		setShowWarning(false);
		setInputValid(true);
		setErrorMessage(null);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<div className="flex justify-center items-start space-x-1">
				<div className="flex flex-col items-center space-y-2">
					<h3 className="text-2xl font-semibold">Description</h3>
					<p className="text-xl">{initialValue}</p>
				</div>
				{
					inEditMode
						? <Button variant='ghost' onClick={() => setOpen(true)}>
							<Edit2Icon />
						</Button>
						: null
				}
			</div>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change Product Description</DialogTitle>
				</DialogHeader>

				{showWarning
					? <>
						<div className="flex justify-start items-stretch space-x-2">
							<AlertOctagonIcon className="stroke-white text-red-500" />
							<span className="font-semibold">Product Description has unsaved changes!</span>
						</div>
						<p>
							Press <span className="font-semibold">Cancel</span> to return to editing the Product Description, or <span className="font-semibold">Confirm</span> to discard changes.
						</p>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowWarning(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => reset()}
							>
								Confirm
							</Button>
						</DialogFooter>
					</>
					: <>
						{
							errorMessage
								? <span className="text-sm text-red-400">{errorMessage}</span>
								: null
						}
						<Input
							className="data-[valid=false]:border-red-500 data-[valid=false]:bg-red-100"
							ref={inputRef}
							placeholder="Enter Product Description..."
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onKeyDownCapture={handleKeyDown}
							data-valid={inputValid}
						/>
						<DialogFooter className="flex justify-between">
							<Button variant={value.trim() !== initialValue ? 'destructive' : 'outline'} onClick={() => setOpen(false)}>Cancel</Button>
							<Button variant='default' onClick={saveDescription}>Save</Button>
						</DialogFooter>
					</>
				}
			</DialogContent>
		</Dialog>
	);
}

function ProductQuantity({
	inEditMode,
	factoryId,
	productCode,
	currentQuantity
}: {
	inEditMode: boolean;
	factoryId: string;
	productCode: string;
	currentQuantity: Prisma.Decimal;
}): React.JSX.Element {
	const initialValue = currentQuantity.toFixed(2);
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(initialValue);
	const [inputValid, setInputValid] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showWarning, setShowWarning] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const utils = api.useContext();
	const { toast } = useToast();

	const mutation = api.product.updateQuantity.useMutation({
		onSuccess(data) {
			const updatedValue = data.quantityInStock.toFixed(2);
			setValue(updatedValue);

			toast({
				title: 'Updated Product Quantity',
				description: <span className="font-semibold">{updatedValue}</span>
			});

			utils.product.getByCode.invalidate({ factoryId, productCode })
				.then(() => {
					console.log('Invalidated product query.');
				}).catch((error) => {
					console.error(error);
				});

			setInputValid(true);
			setErrorMessage(null);
			setOpen(false);
		},
		onError(error) {
			toast({
				title: 'You attempted to set an invalid product quantity!',
				description: error.message
			});
			console.error(error);

			setInputValid(false);
			setErrorMessage(error.message);
		}
	});

	function saveQuantity() {
		if (inputRef.current) {
			const inputValue = inputRef.current.value;

			if (inputValue !== initialValue) {
				const updatedValue = parseFloat(inputValue);
				const schema = z.number().min(0);
				const parsed = schema.safeParse(updatedValue);

				if (parsed.success) {
					mutation.mutate({
						factoryId,
						productCode,
						quantityInStock: updatedValue
					});
				} else {
					setInputValid(false);
					const error = parsed.error;
					const message = error.issues.map((issue) => issue.message).join('\n');
					setErrorMessage(message);
					toast({
						title: 'You attempted to set an invalid product quantity!',
						description: message
					});
					inputRef.current.focus();
				}
			} else {
				reset();
			}
		}
	}

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined = (event) => {
		if (inputRef.current) {
			if (event.key === 'Enter') {
				saveQuantity();
			} else if (event.key === 'Escape') {
				reset();
			}
		}
	};

	function onOpenChange(open: boolean) {
		if (open) {
			setOpen(open);
		} else if (parseFloat(value).toFixed(2) !== initialValue) {
			setShowWarning(true);
		} else {
			reset();
		}
	}

	function reset() {
		setOpen(false);
		setValue(initialValue);
		setShowWarning(false);
		setInputValid(true);
		setErrorMessage(null);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<div className="flex justify-center items-start space-x-1">
				<div className="flex flex-col items-center space-y-2">
					<h3 className="text-2xl font-semibold">Quantity in Stock</h3>
					<p className="text-xl">{initialValue}</p>
				</div>
				{
					inEditMode
						? <Button variant='ghost' onClick={() => setOpen(true)}>
							<Edit2Icon />
						</Button>
						: null
				}
			</div>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change Product Quantity</DialogTitle>
					<DialogDescription>
						<div className="my-2 text-xl flex justify-center items-stretch space-x-3">
							<AlertTriangleIcon className="stroke-white text-yellow-500" />
							<span className="font-semibold">Warning</span>
							<AlertTriangleIcon className="stroke-white text-yellow-500" />
						</div>
						<p>Directly setting the Product Quantity is dangerous. Only proceed with good reason.</p>
					</DialogDescription>
				</DialogHeader>

				{showWarning
					? <>
						<div className="flex justify-start items-stretch space-x-2">
							<AlertOctagonIcon className="stroke-white text-red-500" />
							<span className="font-semibold">Product Quantity has unsaved changes!</span>
						</div>
						<p>
							Press <span className="font-semibold">Cancel</span> to return to editing the Product Quantity, or <span className="font-semibold">Confirm</span> to discard changes.
						</p>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowWarning(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => reset()}
							>
								Confirm
							</Button>
						</DialogFooter>
					</>
					: <>
						{
							errorMessage
								? <span className="text-sm text-red-400">{errorMessage}</span>
								: null
						}
						<Input
							className="data-[valid=false]:border-red-500 data-[valid=false]:bg-red-100"
							ref={inputRef}
							size={10}
							placeholder="Enter Product Quantity..."
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onKeyDownCapture={handleKeyDown}
							data-valid={inputValid}
						/>
						<DialogFooter className="flex justify-between">
							<Button
								type='button'
								variant={parseFloat(value).toFixed(2) !== initialValue ? 'destructive' : 'outline'}
								onClick={() => reset()}
							>
								Cancel
							</Button>
							<Button variant='default' onClick={saveQuantity}>Save</Button>
						</DialogFooter>
					</>
				}
			</DialogContent>
		</Dialog>
	);
}

function ProductPrice({
	inEditMode,
	factoryId,
	productCode,
	currentPrice
}: {
	inEditMode: boolean;
	factoryId: string;
	productCode: string;
	currentPrice: Prisma.Decimal | null;
}): React.JSX.Element {
	const initialValue = currentPrice ? currentPrice.toFixed(2) : '';
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(initialValue);
	const [inputValid, setInputValid] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showWarning, setShowWarning] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const utils = api.useContext();
	const { toast } = useToast();

	const mutation = api.product.updatePrice.useMutation({
		onSuccess(data) {
			const updatedValue = data.salesPrice?.toFixed(2) ?? '';
			setValue(updatedValue);

			toast({
				title: `${updatedValue.length ? 'Updated' : 'Removed'} Product Price`,
				description: <span className="font-semibold">{updatedValue}</span>
			});

			utils.product.getByCode.invalidate({ factoryId, productCode })
				.then(() => {
					console.log('Invalidated product query.');
				}).catch((error) => {
					console.error(error);
				});

			setInputValid(true);
			setErrorMessage(null);
			setOpen(false);
		},
		onError(error) {
			toast({
				title: 'You attempted to set an invalid product price!',
				description: error.message
			});
			console.error(error);

			setInputValid(false);
			setErrorMessage(error.message);
		}
	});

	function savePrice() {
		if (inputRef.current) {
			const inputValue = inputRef.current.value;

			if (inputValue !== initialValue) {
				const updatedValue = inputValue.length ? parseFloat(inputValue) : null;
				const schema = z.number().min(0).nullable();
				const parsed = schema.safeParse(updatedValue);

				if (parsed.success) {
					mutation.mutate({
						factoryId,
						productCode,
						salesPrice: updatedValue
					});
				} else {
					setInputValid(false);
					const error = parsed.error;
					const message = error.issues.map((issue) => issue.message).join('\n');
					setErrorMessage(message);
					toast({
						title: 'You attempted to set an invalid product price!',
						description: message
					});
					inputRef.current.focus();
				}
			} else {
				reset();
			}
		}
	}

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined = (event) => {
		if (inputRef.current) {
			if (event.key === 'Enter') {
				savePrice();
			} else if (event.key === 'Escape') {
				reset();
			}
		}
	};

	function onOpenChange(open: boolean) {
		if (open) {
			setOpen(open);
		} else if (parseFloat(value).toFixed(2) !== initialValue) {
			setShowWarning(true);
		} else {
			reset();
		}
	}

	function reset() {
		setOpen(false);
		setValue(initialValue);
		setShowWarning(false);
		setInputValid(true);
		setErrorMessage(null);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<div className="flex justify-center items-start space-x-1">
				<div className="flex flex-col items-center space-y-2">
					<h3 className="text-2xl font-semibold">Sales Price</h3>
					<p className="text-xl">{initialValue.length ? `$${initialValue}` : 'N/A'}</p>
				</div>
				{
					inEditMode
						? <Button variant='ghost' onClick={() => setOpen(true)}>
							<Edit2Icon />
						</Button>
						: null
				}
			</div>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change Product Price</DialogTitle>
				</DialogHeader>

				{showWarning
					? <>
						<div className="flex justify-start items-stretch space-x-2">
							<AlertOctagonIcon className="stroke-white text-red-500" />
							<span className="font-semibold">Product Price has unsaved changes!</span>
						</div>
						<p>
							Press <span className="font-semibold">Cancel</span> to return to editing the Product Price, or <span className="font-semibold">Confirm</span> to discard changes.
						</p>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowWarning(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => reset()}
							>
								Confirm
							</Button>
						</DialogFooter>
					</>
					: <>
						{
							errorMessage
								? <span className="text-sm text-red-400">{errorMessage}</span>
								: null
						}
						<Input
							className="data-[valid=false]:border-red-500 data-[valid=false]:bg-red-100"
							ref={inputRef}
							size={10}
							placeholder="Enter Product Price..."
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onKeyDownCapture={handleKeyDown}
							data-valid={inputValid}
						/>
						<DialogFooter className="flex justify-between">
							<Button
								type='button'
								variant={parseFloat(value).toFixed(2) !== initialValue ? 'destructive' : 'outline'}
								onClick={() => reset()}
							>
								Cancel
							</Button>
							<Button variant='default' onClick={savePrice}>Save</Button>
						</DialogFooter>
					</>
				}
			</DialogContent>
		</Dialog>
	);
}