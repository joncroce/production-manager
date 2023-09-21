import React, { useRef, useState } from 'react';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import Layout from '@/components/Layout';
import Timestamp from '@/components/Timestamp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertOctagonIcon, AlertTriangleIcon, Edit2Icon } from 'lucide-react';
import { api } from '@/utils/api';
import superjson from '@/utils/superjson';
import { useRouter } from 'next/router';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import type { GetServerSideProps } from 'next';
import type { NextPageWithLayout } from '../../_app';
import type { Session } from 'next-auth';
import type { Prisma } from '@prisma/client';
import { ProductSelector, type TankableProduct } from '../components/product-selector';
import { buildProductCode } from '@/utils/product';
import { columns, type TBlendSummary } from '@/pages/blends/components/blend-list/columns';
import { DataTable } from '@/pages/blends/components/blend-list/data-table';
import { Separator } from '@/components/ui/separator';

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerAuthSession(context);

	return authenticatedSSProps(context).then(async ({ props, redirect }) => {
		if (redirect) {
			return { props, redirect };
		}

		if (typeof context.params?.name !== 'string') {
			return { props, redirect: { destination: '/404', permanent: false } };
		} else {
			const helpers = createServerSideHelpers({
				router: appRouter,
				ctx: createInnerTRPCContext({ session }),
				transformer: superjson
			});

			const name = (context.params?.name ?? '');
			await helpers.tank.getTankByName.prefetch({ factoryId: props.user?.factoryId ?? '', name });

			return {
				props: {
					...props,
					name,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		}
	});
};

const ViewTankPage: NextPageWithLayout<{ user: Session['user']; name: string; }> = ({ user, name }) => {
	const [inEditMode, setInEditMode] = useState(false);
	const tankQuery = api.tank.getTankByName.useQuery({
		factoryId: user.factoryId ?? '',
		name
	}, {
		refetchOnWindowFocus: false,
	});
	const { data: tank } = tankQuery;
	const { factoryId } = user;

	if (!factoryId || !tank) throw new Error('Error retrieving tank data.');

	return (
		<>
			<div className="p-2 flex justify-between items-end space-x-2 border-b">
				<h2 className="text-3xl font-bold">Tank Details</h2>
				<TankName inEditMode={inEditMode} factoryId={factoryId} currentName={name} />
				{
					inEditMode
						? <Button variant='default' onClick={() => setInEditMode(false)}>Switch to View Mode</Button>
						: <Button variant='destructive' onClick={() => setInEditMode(true)}>Switch to Edit Mode</Button>
				}
			</div>
			<div className="flex justify-center items-baseline space-x-4">
				<Timestamp time={tank.updatedAt} label="Updated" />
			</div>

			<div className="py-6 flex justify-evenly items-stretch">
				<TankProduct
					inEditMode={inEditMode}
					factoryId={factoryId}
					tankName={tank.name}
					currentTankProduct={tank.Product}
				/>

				<div className="flex flex-col justify-start items-end space-y-4">
					<TankQuantity
						inEditMode={inEditMode}
						factoryId={factoryId}
						tankName={tank.name}
						tankCapacity={tank.capacity}
						currentTankQuantity={tank.quantity}
					/>
					<TankCapacity
						inEditMode={inEditMode}
						factoryId={factoryId}
						tankName={tank.name}
						tankQuantity={tank.quantity}
						currentTankCapacity={tank.capacity}
					/>
					<TankHeel
						inEditMode={inEditMode}
						factoryId={factoryId}
						tankName={tank.name}
						tankCapacity={tank.capacity}
						currentTankHeel={tank.heel}
					/>
				</div>
			</div>
			<Separator />
			<TankRelatedBlends
				isBlendTank={tank.isBlendTank}
				blendedIn={tank.BlendsBlended}
				destinedFor={tank.BlendsDestined}
				sourcedFrom={tank.BlendComponentsSourced.map((component) => component.Blend)}
			/>
		</>
	);
};

ViewTankPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

function TankName({
	inEditMode,
	factoryId,
	currentName,
}: {
	inEditMode: boolean;
	factoryId: string;
	currentName: string;
}): React.JSX.Element {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(currentName);
	const [inputValid, setInputValid] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showWarning, setShowWarning] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const router = useRouter();

	const { toast } = useToast();

	const mutation = api.tank.updateTankName.useMutation({
		async onSuccess(data) {
			toast({
				title: 'Updated Tank Name',
				description: <span className="font-semibold">{data.name}</span>
			});

			setInputValid(true);
			setErrorMessage(null);
			setOpen(false);

			await router.push(`/tanks/view/${data.name}`);
		},
		onError(error) {
			toast({
				title: 'You attempted to set an invalid tank name!',
				description: error.message
			});

			setInputValid(false);
			setErrorMessage(error.message);
		}
	});


	function saveName() {
		if (inputRef.current) {
			const newName = inputRef.current.value;
			if (newName !== currentName) {
				const schema = z.string().min(1);
				const parsed = schema.safeParse(newName);

				if (parsed.success) {
					mutation.mutate({
						factoryId,
						currentName,
						newName
					});
				} else {
					setInputValid(false);
					const error = parsed.error;
					const message = error.issues.map((issue) => issue.message).join('\n');
					setErrorMessage(message);
					toast({
						title: 'You attempted to set an invalid tank name!',
						description: message
					});
					inputRef.current.focus();
				}
			} else {
				console.log('Tank name was unchanged.');
				setInputValid(true);
				setErrorMessage(null);
				setOpen(false);
			}
		}
	}

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined = (event) => {
		if (inputRef.current) {
			if (event.key === 'Enter') {
				saveName();
			} else if (event.key === 'Escape') {
				inputRef.current.value = currentName;
				setValue(currentName);
				setInputValid(true);
				setErrorMessage(null);
			}
		}
	};

	function onOpenChange(open: boolean) {
		if (open) {
			setOpen(open);
		} else if (currentName !== value) {
			setShowWarning(true);
		} else {
			setValue(currentName);
			setOpen(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<div className="flex justify-center items-end space-x-1">
				<span className="text-2xl font-semibold">Name: </span>
				<span className="text-2xl font-bold">{currentName}</span>
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
					<DialogTitle>Change Tank Name</DialogTitle>
				</DialogHeader>

				{showWarning
					? <>
						<div className="flex justify-start items-stretch space-x-2">
							<AlertOctagonIcon className="stroke-white text-red-500" />
							<span className="font-semibold">Tank Name has unsaved changes!</span>
						</div>
						<p>
							Press <span className="font-semibold">Cancel</span> to return to editing the tank name, or <span className="font-semibold">Confirm</span> to discard changes.
						</p>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowWarning(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => {
									setShowWarning(false);
									setOpen(false);
									setValue(currentName);
									setInputValid(true);
								}}
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
							placeholder="Enter Tank Name..."
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onKeyDownCapture={handleKeyDown}
							data-valid={inputValid}
						/>
						<DialogFooter className="flex justify-between">
							<Button variant={value !== currentName ? 'destructive' : 'outline'} onClick={() => setOpen(false)}>Cancel</Button>
							<Button variant='default' onClick={saveName}>Save</Button>
						</DialogFooter>
					</>
				}
			</DialogContent>
		</Dialog>
	);
}

function TankProduct({
	inEditMode,
	factoryId,
	tankName,
	currentTankProduct
}: {
	inEditMode: boolean;
	factoryId: string;
	tankName: string;
	currentTankProduct: TankableProduct | null;
}): React.JSX.Element {
	const productCode = currentTankProduct
		? buildProductCode(
			currentTankProduct.baseCode,
			currentTankProduct.sizeCode,
			currentTankProduct.variantCode
		)
		: null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<div className="flex justify-between items-stretch space-x-4">
						<h3 className="text-3xl font-bold">Product</h3>
						{
							inEditMode
								? <ProductSelector
									factoryId={factoryId}
									tankName={tankName}
									currentProduct={currentTankProduct}
								/>
								: null
						}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{
					currentTankProduct
						? <div className="space-y-2">
							<span className="text-xl font-semibold">Code: <span className="font-mono">{productCode}</span></span>
							<p className="text-xl">{currentTankProduct.description}</p>
						</div>
						: <span>There is no Product assigned to this Tank.</span>
				}
			</CardContent>
		</Card>
	);
}

function TankQuantity({
	inEditMode,
	factoryId,
	tankName,
	tankCapacity,
	currentTankQuantity
}: {
	inEditMode: boolean;
	factoryId: string;
	tankName: string;
	tankCapacity: Prisma.Decimal;
	currentTankQuantity: Prisma.Decimal;
}): React.JSX.Element {
	const initialValue = currentTankQuantity.toFixed(2);
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(initialValue);
	const [inputValid, setInputValid] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showWarning, setShowWarning] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const utils = api.useContext();
	const { toast } = useToast();

	const mutation = api.tank.updateTankQuantity.useMutation({
		onSuccess(data) {
			const updatedValue = data.quantity.toFixed(2);
			setValue(updatedValue);

			toast({
				title: 'Updated Tank Quantity',
				description: <span className="font-semibold">{updatedValue}</span>
			});

			utils.tank.getTankByName.invalidate({ factoryId, name: tankName })
				.then(() => {
					console.log('Invalidated tank query.');
				}).catch((error) => {
					console.error(error);
				});

			setInputValid(true);
			setErrorMessage(null);
			setOpen(false);
		},
		onError(error) {
			toast({
				title: 'You attempted to set an invalid tank quantity!',
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
				const schema = z.number().min(0).max(tankCapacity.toNumber());
				const parsed = schema.safeParse(updatedValue);

				if (parsed.success) {
					mutation.mutate({
						factoryId,
						name: tankName,
						quantity: updatedValue
					});
				} else {
					setInputValid(false);
					const error = parsed.error;
					const message = error.issues.map((issue) => issue.message).join('\n');
					setErrorMessage(message);
					toast({
						title: 'You attempted to set an invalid tank quantity!',
						description: message
					});
					inputRef.current.focus();
				}
			} else {
				console.log('Tank quantity was unchanged.');
				setInputValid(true);
				setErrorMessage(null);
				setOpen(false);
			}
		}
	}

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined = (event) => {
		if (inputRef.current) {
			if (event.key === 'Enter') {
				saveQuantity();
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
		} else if (parseFloat(value).toFixed(2) !== initialValue) {
			setShowWarning(true);
		} else {
			setValue(initialValue);
			setOpen(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<div className="flex justify-center items-end space-x-1">
				<span className="text-2xl font-semibold">Quantity: </span>
				<span className="text-2xl font-bold">{initialValue}</span>
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
					<DialogTitle>Change Tank Quantity</DialogTitle>
					<DialogDescription>
						<div className="my-2 text-xl flex justify-center items-stretch space-x-3">
							<AlertTriangleIcon className="stroke-white text-yellow-500" />
							<span className="font-semibold">Warning</span>
							<AlertTriangleIcon className="stroke-white text-yellow-500" />
						</div>
						<p>Directly setting the Tank Quantity is dangerous. Only proceed with good reason.</p>
					</DialogDescription>
				</DialogHeader>

				{showWarning
					? <>
						<div className="flex justify-start items-stretch space-x-2">
							<AlertOctagonIcon className="stroke-white text-red-500" />
							<span className="font-semibold">Tank Quantity has unsaved changes!</span>
						</div>
						<p>
							Press <span className="font-semibold">Cancel</span> to return to editing the Tank Quantity, or <span className="font-semibold">Confirm</span> to discard changes.
						</p>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowWarning(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => {
									setShowWarning(false);
									setOpen(false);
									setValue(initialValue);
									setInputValid(true);
								}}
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
							placeholder="Enter Tank Quantity..."
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onKeyDownCapture={handleKeyDown}
							data-valid={inputValid}
						/>
						<DialogFooter className="flex justify-between">
							<Button variant={parseFloat(value).toFixed(2) !== initialValue ? 'destructive' : 'outline'} onClick={() => setOpen(false)}>Cancel</Button>
							<Button variant='default' onClick={saveQuantity}>Save</Button>
						</DialogFooter>
					</>
				}
			</DialogContent>
		</Dialog>
	);
}

function TankCapacity({
	inEditMode,
	factoryId,
	tankName,
	tankQuantity,
	currentTankCapacity
}: {
	inEditMode: boolean;
	factoryId: string;
	tankName: string;
	tankQuantity: Prisma.Decimal;
	currentTankCapacity: Prisma.Decimal;
}): React.JSX.Element {
	const initialValue = currentTankCapacity.toFixed(2);
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(initialValue);
	const [inputValid, setInputValid] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showWarning, setShowWarning] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const utils = api.useContext();
	const { toast } = useToast();

	const mutation = api.tank.updateTankCapacity.useMutation({
		onSuccess(data) {
			const updatedValue = data.capacity.toFixed(2);
			setValue(updatedValue);

			toast({
				title: 'Updated Tank Capacity',
				description: <span className="font-semibold">{updatedValue}</span>
			});

			utils.tank.getTankByName.invalidate({ factoryId, name: tankName })
				.then(() => {
					console.log('Invalidated tank query.');
				}).catch((error) => {
					console.error(error);
				});

			setInputValid(true);
			setErrorMessage(null);
			setOpen(false);
		},
		onError(error) {
			toast({
				title: 'You attempted to set an invalid tank capacity!',
				description: error.message
			});
			console.error(error);

			setInputValid(false);
			setErrorMessage(error.message);
		}
	});

	function saveCapacity() {
		if (inputRef.current) {
			const inputValue = inputRef.current.value;

			if (inputValue !== initialValue) {
				const updatedValue = parseFloat(inputValue);
				const schema = z.number().min(tankQuantity.toNumber());
				const parsed = schema.safeParse(updatedValue);

				if (parsed.success) {
					mutation.mutate({
						factoryId,
						name: tankName,
						capacity: updatedValue
					});
				} else {
					setInputValid(false);
					const error = parsed.error;
					const message = error.issues.map((issue) => issue.message).join('\n');
					setErrorMessage(message);
					toast({
						title: 'You attempted to set an invalid tank capacity!',
						description: message
					});
					inputRef.current.focus();
				}
			} else {
				console.log('Tank capacity was unchanged.');
				setInputValid(true);
				setErrorMessage(null);
				setOpen(false);
			}
		}
	}

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined = (event) => {
		if (inputRef.current) {
			if (event.key === 'Enter') {
				saveCapacity();
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
		} else if (parseFloat(value).toFixed(2) !== initialValue) {
			setShowWarning(true);
		} else {
			setValue(initialValue);
			setOpen(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<div className="flex justify-center items-end space-x-1">
				<span className="text-2xl font-semibold">Capacity: </span>
				<span className="text-2xl font-bold">{initialValue}</span>
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
					<DialogTitle>Change Tank Capacity</DialogTitle>
				</DialogHeader>

				{showWarning
					? <>
						<div className="flex justify-start items-stretch space-x-2">
							<AlertOctagonIcon className="stroke-white text-red-500" />
							<span className="font-semibold">Tank Capacity has unsaved changes!</span>
						</div>
						<p>
							Press <span className="font-semibold">Cancel</span> to return to editing the Tank Capacity, or <span className="font-semibold">Confirm</span> to discard changes.
						</p>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowWarning(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => {
									setShowWarning(false);
									setOpen(false);
									setValue(initialValue);
									setInputValid(true);
								}}
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
							placeholder="Enter Tank Capacity..."
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onKeyDownCapture={handleKeyDown}
							data-valid={inputValid}
						/>
						<DialogFooter className="flex justify-between">
							<Button variant={parseFloat(value).toFixed(2) !== initialValue ? 'destructive' : 'outline'} onClick={() => setOpen(false)}>Cancel</Button>
							<Button variant='default' onClick={saveCapacity}>Save</Button>
						</DialogFooter>
					</>
				}
			</DialogContent>
		</Dialog>
	);
}

function TankHeel({
	inEditMode,
	factoryId,
	tankName,
	tankCapacity,
	currentTankHeel
}: {
	inEditMode: boolean;
	factoryId: string;
	tankName: string;
	tankCapacity: Prisma.Decimal;
	currentTankHeel: Prisma.Decimal;
}): React.JSX.Element {
	const initialValue = currentTankHeel.toFixed(2);
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(initialValue);
	const [inputValid, setInputValid] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showWarning, setShowWarning] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const utils = api.useContext();
	const { toast } = useToast();

	const mutation = api.tank.updateTankHeel.useMutation({
		onSuccess(data) {
			const updatedValue = data.heel.toFixed(2);
			setValue(updatedValue);

			toast({
				title: 'Updated Tank Heel',
				description: <span className="font-semibold">{updatedValue}</span>
			});

			utils.tank.getTankByName
				.invalidate({ factoryId, name: tankName })
				.then(() => { console.log('Invalidated tank query.'); })
				.catch((error) => { console.error(error); });

			setInputValid(true);
			setErrorMessage(null);
			setOpen(false);
		},
		onError(error) {
			toast({
				title: 'You attempted to set an invalid tank heel!',
				description: error.message
			});
			console.error(error);

			setInputValid(false);
			setErrorMessage(error.message);
		}
	});

	function saveHeel() {
		if (inputRef.current) {
			const inputValue = inputRef.current.value;

			if (inputValue !== initialValue) {
				const updatedValue = parseFloat(inputValue);
				const schema = z.number().min(0).max(tankCapacity.toNumber());
				const parsed = schema.safeParse(updatedValue);

				if (parsed.success) {
					mutation.mutate({
						factoryId,
						name: tankName,
						heel: updatedValue
					});
				} else {
					setInputValid(false);
					const error = parsed.error;
					const message = error.issues.map((issue) => issue.message).join('\n');
					setErrorMessage(message);
					toast({
						title: 'You attempted to set an invalid tank heel!',
						description: message
					});
					inputRef.current.focus();
				}
			} else {
				console.log('Tank heel was unchanged.');
				setInputValid(true);
				setErrorMessage(null);
				setOpen(false);
			}
		}
	}

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined = (event) => {
		if (inputRef.current) {
			if (event.key === 'Enter') {
				saveHeel();
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
		} else if (parseFloat(value).toFixed(2) !== initialValue) {
			setShowWarning(true);
		} else {
			setValue(initialValue);
			setOpen(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<div className="flex justify-center items-end space-x-1">
				<span className="text-2xl font-semibold">Heel: </span>
				<span className="text-2xl font-bold">{initialValue}</span>
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
					<DialogTitle>Change Tank Heel</DialogTitle>
				</DialogHeader>

				{showWarning
					? <>
						<div className="flex justify-start items-stretch space-x-2">
							<AlertOctagonIcon className="stroke-white text-red-500" />
							<span className="font-semibold">Tank Heel has unsaved changes!</span>
						</div>
						<p>
							Press <span className="font-semibold">Cancel</span> to return to editing the Tank Heel, or <span className="font-semibold">Confirm</span> to discard changes.
						</p>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowWarning(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => {
									setShowWarning(false);
									setOpen(false);
									setValue(initialValue);
									setInputValid(true);
								}}
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
							placeholder="Enter Tank Heel..."
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onKeyDownCapture={handleKeyDown}
							data-valid={inputValid}
						/>
						<DialogFooter className="flex justify-between">
							<Button variant={parseFloat(value).toFixed(2) !== initialValue ? 'destructive' : 'outline'} onClick={() => setOpen(false)}>Cancel</Button>
							<Button variant='default' onClick={saveHeel}>Save</Button>
						</DialogFooter>
					</>
				}
			</DialogContent>
		</Dialog>
	);
}

function TankRelatedBlends({
	isBlendTank,
	blendedIn,
	destinedFor,
	sourcedFrom,
}: {
	isBlendTank: boolean;
	blendedIn: Array<TBlendSummary>;
	destinedFor: Array<TBlendSummary>;
	sourcedFrom: Array<TBlendSummary>;
}): React.JSX.Element {
	return (
		<div className="p-4 flex flex-col space-y-4">
			<h3 className="text-2xl font-bold">Related Blends</h3>
			{isBlendTank
				? <DataTable columns={columns} data={blendedIn} />
				: <Tabs defaultValue='destinedFor'>
					< TabsList>
						<TabsTrigger value="destinedFor">Destined For</TabsTrigger>
						<TabsTrigger value="sourcedFrom">Sourced From</TabsTrigger>
					</TabsList>
					<TabsContent value="destinedFor">
						<DataTable columns={columns} data={destinedFor} usePagination={true} />
					</TabsContent>
					<TabsContent value="sourcedFrom">
						<DataTable columns={columns} data={sourcedFrom} usePagination={true} />
					</TabsContent>
				</Tabs>
			}
		</div>
	);
}

export default ViewTankPage;;