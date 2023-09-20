import React, { useState } from 'react';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import Layout from '@/components/Layout';
import Timestamp from '@/components/Timestamp';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { AlertOctagonIcon, AlertTriangleIcon, Edit2Icon, ScrollTextIcon } from 'lucide-react';
import BlendStatusSelector from '../components/blend-status-selector';
import BlendTankSelector from '../components/blend-tank-selector';
import DestinationTankSelector from '../components/destination-tank-selector';
import { DataTable } from '../components/component-list/data-table';
import { getColumns, type TBlendComponentSummary } from '../components/component-list/columns';
import { api } from '@/utils/api';
import superjson from '@/utils/superjson';
import { buildProductCode } from '@/utils/product';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../../_app';
import type { BlendRouterOutputs } from '@/server/api/routers/blend';
import type { TBlendStatus } from '@/schemas/blend';

function extendBlendComponents(components: BlendRouterOutputs['get']['Components']): Array<TBlendComponentSummary> {
	return components.map((component) => {
		const { baseCode, sizeCode, variantCode } = component.Product;
		const productCode = buildProductCode(baseCode, sizeCode, variantCode);

		return {
			id: component.id,
			blendId: component.blendId,
			productCode,
			productDescription: component.Product.description,
			sourceTankName: component.SourceTank.name,
			targetQuantity: component.targetQuantity,
			actualQuantity: component.actualQuantity,
			note: component.note
		};
	});
}

export const getServerSideProps: GetServerSideProps = async (context) => {

	const session = await getServerAuthSession(context);

	return authenticatedSSProps(context).then(async ({ props, redirect }) => {
		if (typeof context.params?.id !== 'string') {
			return { props, redirect: { destination: '/404', permanent: false } };
		} else {
			const id = context.params?.id ?? '';
			const helpers = createServerSideHelpers({
				router: appRouter,
				ctx: createInnerTRPCContext({ session }),
				transformer: superjson
			});

			await helpers.blend.get.prefetch({ factoryId: props.user?.factoryId ?? '', id });

			return {
				props: {
					...props,
					id,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		}
	});
};

const ViewBlendPage: NextPageWithLayout<{ user: Session['user']; id: string; }> = ({ user, id }) => {
	const [inEditMode, setInEditMode] = useState(false);
	const blendQuery = api.blend.get.useQuery(
		{ factoryId: user.factoryId ?? '', id },
		{ refetchOnWindowFocus: false }
	);
	const { data: blend } = blendQuery;
	const { factoryId } = user;

	if (!factoryId || !blend) throw new Error('Error retrieving blend data.');

	const { baseCode, sizeCode, variantCode } = blend;
	const productCode = buildProductCode(baseCode, sizeCode, variantCode);

	const totalActualQuantity = blend.Components.reduce((total, component) => {
		const quantity = component.actualQuantity;

		return quantity ? total + quantity.toNumber() : total;
	}, 0);

	return (
		<>
			<div className="p-2 flex justify-between items-end space-x-2 border-b">
				<h2 className="text-3xl font-bold">Blend Details</h2>
				<BlendStatus inEditMode={inEditMode} factoryId={factoryId} blendId={blend.id} currentStatus={blend.status as TBlendStatus} />
				{
					inEditMode
						? <Button variant='default' onClick={() => setInEditMode(false)}>Switch to View Mode</Button>
						: <Button variant='destructive' onClick={() => setInEditMode(true)}>Switch to Edit Mode</Button>
				}
			</div>

			<div className="flex justify-center items-baseline space-x-4">
				<Timestamp time={blend.createdAt} label="Created" />
				<Timestamp time={blend.updatedAt} label="Updated" />
			</div>

			<div className="grid grid-cols-[1fr_2fr_1fr]">
				<BlendTank
					inEditMode={inEditMode}
					factoryId={factoryId}
					blendId={blend.id}
					currentBlendTankName={blend.blendTankName}
					blendTankQuantity={totalActualQuantity}
					blendTankCapacity={blend.BlendTank ? blend.BlendTank.capacity.toNumber() : undefined}
					blendTargetQuantity={blend.targetQuantity.toNumber()}
				/>
				<Product {...blend.Product} targetQuantity={blend.targetQuantity.toNumber()} />
				<DestinationTank
					inEditMode={inEditMode}
					factoryId={factoryId}
					blendId={blend.id}
					baseCode={blend.baseCode}
					currentDestinationTankName={blend.destinationTankName}
					destinationTankQuantity={blend.DestinationTank ? blend.DestinationTank.quantity.toNumber() : undefined}
					destinationTankCapacity={blend.DestinationTank ? blend.DestinationTank.capacity.toNumber() : undefined}
					totalActualQuantity={totalActualQuantity}
				/>
			</div>

			<div className="p-4 flex flex-col space-y-4 border-t">
				<div className="flex justify-between items-baseline">
					<h3 className="text-3xl font-semibold">Components</h3>
					<BlendNote
						inEditMode={inEditMode}
						blendId={blend.id}
						productCode={productCode}
						productDescription={blend.Product.description}
						targetQuantity={blend.targetQuantity.toNumber()}
						note={blend.note ?? undefined}
					/>
				</div>
				<DataTable columns={getColumns({ inEditMode })} data={extendBlendComponents(blend.Components)} />
			</div>
		</>
	);
};

ViewBlendPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default ViewBlendPage;

function BlendStatus({
	inEditMode,
	factoryId,
	blendId,
	currentStatus
}: {
	inEditMode: boolean;
	factoryId: string;
	blendId: string;
	currentStatus: TBlendStatus;
}): React.JSX.Element {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex justify-center items-end space-x-1">
			<span className="text-2xl font-semibold">Status: </span>
			<span className="text-2xl font-bold">{currentStatus}</span>
			{
				inEditMode
					? <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
						<Button variant='ghost' type="button" onClick={() => void setOpen(true)}>
							<Edit2Icon />
						</Button>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Set Blend Status</DialogTitle>
							</DialogHeader>
							<BlendStatusSelector factoryId={factoryId} blendId={blendId} currentStatus={currentStatus} closeDialog={() => setOpen(false)} />
						</DialogContent>
					</Dialog>
					: null
			}
		</div>
	);
}

function BlendTank({
	inEditMode,
	factoryId,
	blendId,
	currentBlendTankName,
	blendTankQuantity,
	blendTankCapacity,
	blendTargetQuantity
}: {
	inEditMode: boolean;
	factoryId: string;
	blendId: string;
	currentBlendTankName: string | null;
	blendTankQuantity: number;
	blendTankCapacity?: number;
	blendTargetQuantity: number;
}): React.JSX.Element {
	const [open, setOpen] = useState(false);

	const warning = blendTankCapacity && blendTankCapacity < blendTargetQuantity
		? 'Blend Tank capacity is lower than the blend\'s target quantity!'
		: null;

	return (
		<div className="p-4 flex flex-col justify-between">
			<div className="flex flex-col items-center space-y-1">
				<div className="flex justify-start items-stretch space-x-2">
					<h3 className="text-2xl font-semibold">Blend Tank</h3>
					{
						inEditMode
							? <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
								<Button variant='ghost' type="button" onClick={() => void setOpen(true)}>
									<Edit2Icon />
								</Button>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Select Blend Tank</DialogTitle>
									</DialogHeader>
									<BlendTankSelector
										factoryId={factoryId}
										blendId={blendId}
										currentBlendTankName={currentBlendTankName}
										closeDialog={() => setOpen(false)}
									/>
								</DialogContent>
							</Dialog>
							: null
					}
				</div>
				{
					warning
						? <TooltipProvider>
							<Tooltip delayDuration={0}>
								<TooltipTrigger>
									<span className="flex justify-start items-stretch space-x-2 text-xl text-red-500">
										{currentBlendTankName ?? '(No Tank)'}
										<AlertTriangleIcon className="stroke-white text-red-500" />
									</span>
								</TooltipTrigger>
								<TooltipContent>
									<p>{warning}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						: <span className="text-xl">{currentBlendTankName ?? '(No Tank)'}</span>
				}
			</div>
			{
				currentBlendTankName
					? <div className="text-2xl flex flex-col justify-end items-center">
						<h3 className="font-semibold">Blend Tank Qty.</h3>
						<span className="font-mono">{blendTankQuantity}/{blendTankCapacity}</span>
					</div>
					: null
			}
		</div>
	);
}

function Product({
	baseCode,
	sizeCode,
	variantCode,
	description,
	targetQuantity
}: {
	baseCode: number;
	sizeCode: number;
	variantCode: number;
	description: string;
	targetQuantity: number;
}): React.JSX.Element {
	const productCode = buildProductCode(baseCode, sizeCode, variantCode);
	return (
		<div className="p-4 flex flex-col justify-between space-y-4">
			<div className="flex flex-col justify-start items-center">
				<span className="text-2xl font-semibold">Product</span>
				<span className="text-xl">{productCode}</span>
				<span className="text-xl">{description}</span>
			</div>

			<div className="text-2xl flex flex-col items-center space-y-1">
				<h3 className="font-semibold">Target Quantity</h3>
				<span className="font-mono">{targetQuantity}</span>
			</div>
		</div>
	);
}

function DestinationTank({
	inEditMode,
	factoryId,
	blendId,
	baseCode,
	currentDestinationTankName,
	destinationTankQuantity,
	destinationTankCapacity,
	totalActualQuantity
}: {
	inEditMode: boolean;
	factoryId: string;
	blendId: string;
	baseCode: number;
	currentDestinationTankName: string | null;
	destinationTankQuantity?: number;
	destinationTankCapacity?: number;
	totalActualQuantity: number;
}): React.JSX.Element {
	const [open, setOpen] = useState(false);

	const warning = destinationTankCapacity !== undefined &&
		destinationTankQuantity !== undefined &&
		destinationTankCapacity - destinationTankQuantity < totalActualQuantity
		? 'Destination Tank remaining capacity is lower than the blend\'s actual quantity!'
		: null;

	return (
		<div className="p-4 flex flex-col justify-between">
			<div className="flex flex-col items-center space-y-1">
				<div className="flex justify-start items-stretch space-x-2">
					<span className="text-2xl font-semibold">Destination Tank</span>
					{
						inEditMode
							? <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
								<Button variant='ghost' type="button" onClick={() => void setOpen(true)}>
									<Edit2Icon />
								</Button>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Select Destination Tank</DialogTitle>
									</DialogHeader>
									<DestinationTankSelector factoryId={factoryId} blendId={blendId} baseCode={baseCode} currentDestinationTankName={currentDestinationTankName} closeDialog={() => setOpen(false)} />
								</DialogContent>
							</Dialog>
							: null
					}
				</div>
				{
					warning
						? <TooltipProvider>
							<Tooltip delayDuration={0}>
								<TooltipTrigger>
									<span className="flex justify-start items-stretch space-x-2 text-xl text-red-500">
										{currentDestinationTankName ?? '(No Tank)'}
										<AlertTriangleIcon className="stroke-white text-red-500" />
									</span>
								</TooltipTrigger>
								<TooltipContent>
									<p>{warning}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						: <span className="text-xl">{currentDestinationTankName ?? '(No Tank)'}</span>
				}
			</div>
			{
				destinationTankQuantity !== undefined
					? <div className="text-2xl flex flex-col justify-end items-center">
						<h3 className="font-semibold">Destination Tank Qty.</h3>
						<span className="font-mono">{destinationTankQuantity}/{destinationTankCapacity}</span>
					</div>
					: null
			}
		</div>
	);
}

function BlendNote({
	inEditMode,
	note,
	blendId,
	productCode,
	productDescription,
	targetQuantity
}: {
	inEditMode: boolean;
	note?: string;
	blendId: string;
	productCode: string;
	productDescription: string;
	targetQuantity: number;
}): React.JSX.Element | null {
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState(!note?.length);
	const [text, setText] = useState(note ?? '');
	const [showWarning, setShowWarning] = useState(false);

	const mutation = api.blend.updateNote.useMutation({
		onSuccess(data) {
			toast({
				title: `${data.note === null ? 'Removed' : 'Updated'} Blend Note`,
				description: <span className="font-semibold">{productDescription}</span>
			});

			utils.blend.get.invalidate({ id: blendId })
				.then(() => {
					console.log('Invalidated blend query.');
				}).catch((error) => {
					console.error(error);
				});
		},
		onError(error) {
			toast({
				title: 'Error Updating Blend Note',
				description: error.message
			});
		}
	});

	const utils = api.useContext();
	const { toast } = useToast();

	function saveNote() {
		const updatedValue = !text.length ? undefined : text;

		if (updatedValue !== note) {
			mutation.mutate({
				blendId,
				note: updatedValue
			});
		} else {
			console.log('Value was unchanged.');
		}

		setEditing(false);
	}

	function onOpenChange(open: boolean) {
		if (open) {
			setOpen(open);
		} else if (editing && (note ?? '') !== text) {
			setShowWarning(true);
		} else {
			setText(note ?? '');
			setEditing(!note?.length);
			setOpen(open);
		}
	}

	return note?.length ?? inEditMode ? (
		<Dialog open={open} onOpenChange={onOpenChange}>

			<Button variant={note?.length ? 'outline' : 'ghost'} onClick={() => setOpen(true)}>
				{note?.length ? 'View' : 'Add'} Blend Note <ScrollTextIcon className="ml-2 h-4 w-4" />
			</Button>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Blend Note</DialogTitle>
					<div className="flex justify-between">
						<div className="flex flex-col">
							<span className="font-semibold">{productCode}</span>
							<span>{productDescription}</span>
						</div>
						<div className="flex flex-col">
							<span className="border-b">Target Qty</span>
							<span className="font-semibold">{targetQuantity.toFixed(2)}</span>
						</div>
					</div>
				</DialogHeader>

				{showWarning
					? <>
						<div className="flex justify-start items-stretch space-x-2">
							<AlertOctagonIcon className="stroke-white text-red-500" />
							<span className="font-semibold">Note has unsaved changes!</span>
						</div>
						<p>
							Press <span className="font-semibold">Cancel</span> to return to editing this note, or <span className="font-semibold">Confirm</span> to discard changes.
						</p>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowWarning(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => {
									setShowWarning(false);
									setOpen(false);
									setEditing(!note?.length);
									setText(note ?? '');
								}}
							>
								Confirm
							</Button>
						</DialogFooter>
					</>
					: editing
						? <>
							<Textarea placeholder="Type your note here..." value={text} onChange={(e) => setText(e.target.value)} />
							<div className="flex justify-between">
								<Button variant='destructive' onClick={() => setEditing(false)}>Cancel</Button>
								<Button variant='default' onClick={saveNote}>Save</Button>
							</div>
						</>
						: <>
							<p className="p-2">{note}</p>
							{
								inEditMode
									? <Button variant="outline" onClick={() => setEditing(true)}>
										Edit <Edit2Icon className="ml-2 h-4 w-4" />
									</Button>
									: null
							}
						</>
				}

			</DialogContent>
		</Dialog>
	) : null;
}