"use client";

import React, { useRef, useState } from 'react';
import { api } from '@/utils/api';
import { sortDecimal } from '@/utils/tableSorts';
import { parseProductCode } from '@/utils/product';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertOctagonIcon, AlertTriangleIcon, ArrowUpDown, Edit2Icon, ScrollTextIcon } from 'lucide-react';
import SourceTankSelector from '../source-tank-selector';
import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import type { BlendRouterOutputs } from '@/server/api/routers/blend';

export type TBlendComponentSummary =
	Pick<
		BlendRouterOutputs['get']['Components'][number],
		'factoryId' | 'id' | 'blendId' | 'sourceTankName' | 'targetQuantity' | 'actualQuantity' | 'note'
	>
	& {
		productCode: string;
		productDescription: string;
		hasBlendTank: boolean;
		sourceTankAvailableQuantity: Prisma.Decimal;
		blendTotalActualQuantity: Prisma.Decimal;
	};

function sortableHeader(
	{ column }: HeaderContext<TBlendComponentSummary, unknown>,
	label: string
): React.JSX.Element {
	return (
		<Button
			variant='ghost'
			onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
		>
			{label}
			<ArrowUpDown className='ml-2 h-4 w-4' />
		</Button>
	);
}

export function getColumns({ inEditMode }: { inEditMode: boolean; }): ColumnDef<TBlendComponentSummary>[] {
	return [
		{
			accessorKey: 'productCode',
			header: (ctx) => sortableHeader(ctx, 'Code'),
			cell({ getValue }): React.JSX.Element {
				const productCode = getValue<TBlendComponentSummary['productCode']>();

				return (
					<Link className="underline" href={`/products/view/${productCode}`} onClick={(e) => e.stopPropagation()}>{productCode}</Link>
				);
			}
		},
		{
			accessorKey: 'productDescription',
			header: 'Description'
		},
		{
			accessorKey: 'sourceTankName',
			header: (ctx) => sortableHeader(ctx, 'Tank'),
			cell({ row, getValue }): React.JSX.Element {
				// eslint-disable-next-line react-hooks/rules-of-hooks
				const [dialogOpen, setDialogOpen] = useState(false);
				const sourceTankName = getValue<TBlendComponentSummary['sourceTankName']>();
				const { factoryId, id, blendId, productCode, actualQuantity } = row.original;
				const { baseCode } = parseProductCode(productCode);

				return inEditMode ? (
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button variant='outline'>{sourceTankName}</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Source Tank</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<Link href={`/tanks/view/${sourceTankName}`}>Go to Tank Details</Link>
							</DropdownMenuItem>
							<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
								<DialogTrigger>
									<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Change Tank...</DropdownMenuItem>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Change Source Tank</DialogTitle>
										<DialogDescription>
											{
												actualQuantity && actualQuantity.greaterThan(0)
													? <div className="mt-3 flex flex-col justify-start space-y-2">
														<span className="flex justify-start items-center space-x-1 text-lg">
															<AlertTriangleIcon className="w-6 h-6 stroke-white fill-red-500" />
															<span className="font-semibold text-gray-900">Warning</span>
														</span>
														<span>Product has already been taken from the current source tank. Are you sure you want to change it?</span>
													</div>
													: <span>Choose a new source tank for Product Code <span className="font-mono">{productCode}</span>.</span>
											}
										</DialogDescription>
									</DialogHeader>
									<SourceTankSelector
										factoryId={factoryId}
										componentId={id}
										blendId={blendId}
										baseCode={baseCode}
										currentSourceTankName={sourceTankName}
										closeDialog={() => setDialogOpen(false)}
									/>
								</DialogContent>
							</Dialog>
						</DropdownMenuContent>
					</DropdownMenu>
				) : <Link className="underline" href={`/tanks/view/${sourceTankName}`} onClick={(e) => e.stopPropagation()}>{sourceTankName}</Link>;
			}
		},
		{
			accessorKey: 'targetQuantity',
			header: (ctx) => sortableHeader(ctx, 'Qty (Target)'),
			cell({ row, getValue }) {
				const { sourceTankAvailableQuantity } = row.original;
				const targetQuantity = getValue<TBlendComponentSummary['targetQuantity']>();
				const formatted = targetQuantity.toFixed(2);

				const warning = sourceTankAvailableQuantity.lessThan(targetQuantity)
					? 'Insufficient available quantity in source tank (excluding tank heel).'
					: null;

				return (
					<div className="flex items-center space-x-1">
						<span
							className="data-[has-warning=true]:text-red-500"
							data-has-warning={Boolean(warning)}
						>
							{formatted}
						</span>
						{warning
							? <TooltipProvider>
								<Tooltip delayDuration={0}>
									<TooltipTrigger>
										<AlertTriangleIcon className="stroke-white text-red-500" />
									</TooltipTrigger>
									<TooltipContent>
										<p>{warning}</p>
										<p>Available: {sourceTankAvailableQuantity.toFixed(2)}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							: null
						}
					</div>
				);
			},
			sortingFn: sortDecimal
		},
		{
			accessorKey: 'actualQuantity',
			header: (ctx) => sortableHeader(ctx, 'Qty (Actual)'),
			cell({ row, getValue }) {
				const { blendId, id: componentId, hasBlendTank, blendTotalActualQuantity } = row.original;
				const actualQuantity = getValue<TBlendComponentSummary['actualQuantity']>();
				const formatted = actualQuantity?.toFixed(2) ?? '';

				return inEditMode && hasBlendTank
					? <EditableActualQuantityCell
						actualQuantity={actualQuantity}
						blendId={blendId}
						componentId={componentId}
						blendTotalActualQuantity={blendTotalActualQuantity}
					/>
					: <span>{formatted}</span>;
			},
			sortingFn: sortDecimal
		},
		{
			accessorKey: 'note',
			header: 'Note',
			cell({ row, getValue }) {
				const { blendId, id: componentId, productCode, productDescription, targetQuantity } = row.original;
				const note = getValue<string | undefined>();

				return <NoteCell
					inEditMode={inEditMode}
					note={note}
					blendId={blendId}
					componentId={componentId}
					productCode={productCode}
					productDescription={productDescription}
					targetQuantity={targetQuantity}
				/>;
			}
		},
	];
}

function EditableActualQuantityCell({
	actualQuantity,
	blendId,
	componentId,
	blendTotalActualQuantity
}: {
	actualQuantity: Prisma.Decimal | null;
	blendId: string;
	componentId: string;
	blendTotalActualQuantity: Prisma.Decimal;
}): React.JSX.Element {
	const initialValue = actualQuantity?.toFixed(2) ?? '';
	const [value, setValue] = useState(initialValue);
	const [inputValid, setInputValid] = useState(true);
	const inputRef = useRef<HTMLInputElement>(null);
	const mutation = api.blend.updateComponentActualQuantity.useMutation({
		onSuccess(data) {
			const updatedValue = data.actualQuantity?.toFixed(2) ?? '';
			setInputValid(true);
			setValue(updatedValue);
			toast({
				title: `${data.actualQuantity === null ? 'Removed' : 'Updated'} Component Actual Quantity`,
				description: (
					<div className="flex flex-col items-start">
						<span className="font-semibold">{data.Product.description}</span>
						<span>{updatedValue}</span>
					</div>
				)
			});

			utils.blend.get.invalidate({ id: blendId })
				.then(() => {
					console.log('Invalidated blend query.');
				}).catch((error) => {
					console.error(error);
				});
			utils.tank.getTankByName.invalidate({ factoryId: data.factoryId, name: data.SourceTank.name })
				.then(() => {
					console.log('Invalidated tank query.');
				}).catch((error) => {
					console.error(error);
				});
		},
		onError(error) {
			toast({
				title: 'Error Updating Component Actual Quantity',
				description: error.message
			});
			console.error(error);
			setInputValid(false);
			inputRef.current?.focus();
		}
	});

	const utils = api.useContext();
	const { toast } = useToast();

	const handleBlur: React.FocusEventHandler<HTMLInputElement> | undefined = () => {
		if (inputRef.current) {
			const value = inputRef.current.value;
			if (value !== initialValue) {
				const updatedActualQuantity = !value.length ? undefined : parseFloat(value);
				const schema = z.number().min(0).optional();
				const parsed = schema.safeParse(updatedActualQuantity);

				if (parsed.success) {
					setInputValid(true);

					const quantityAddedToBlend = actualQuantity
						? new Prisma.Decimal(updatedActualQuantity ?? 0).sub(actualQuantity)
						: new Prisma.Decimal(updatedActualQuantity ?? 0);
					const updatedBlendTotalActualQuantity = blendTotalActualQuantity.add(quantityAddedToBlend);

					mutation.mutate({
						blendId,
						componentId,
						actualQuantity: updatedActualQuantity,
						quantityAddedToBlend: quantityAddedToBlend.toNumber(),
						blendTotalActualQuantity: updatedBlendTotalActualQuantity.toNumber()
					});
				} else {
					setInputValid(false);
					const error = parsed.error;
					console.error(error);
					toast({
						title: 'You attempted to set an invalid quantity!',
						description: error.issues.map((issue) => issue.message).join('\n')
					});
					inputRef.current.focus();
				}
			} else {
				console.log('Value was unchanged.');
			}
		}
	};

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined = (event) => {
		if (inputRef.current) {
			if (event.key === 'Enter') {
				inputRef.current.blur();
			} else if (event.key === 'Escape') {
				inputRef.current.value = initialValue;
				setValue(initialValue);
				setInputValid(true);
				inputRef.current.blur();
			}
		}
	};

	return (
		<Input
			className="data-[valid=false]:border-red-500 data-[valid=false]:bg-red-100"
			ref={inputRef}
			size={10}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			onBlur={handleBlur}
			onKeyDownCapture={handleKeyDown}
			data-valid={inputValid}
		/>
	);
}

function NoteCell({
	inEditMode,
	note,
	blendId,
	componentId,
	productCode,
	productDescription,
	targetQuantity
}: {
	inEditMode: boolean;
	note?: string;
	blendId: string;
	componentId: string;
	productCode: string;
	productDescription: string;
	targetQuantity: Prisma.Decimal | null;
}): React.JSX.Element | null {
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState(!note?.length);
	const [text, setText] = useState(note ?? '');
	const [showWarning, setShowWarning] = useState(false);

	const mutation = api.blend.updateComponentNote.useMutation({
		onSuccess(data) {
			toast({
				title: `${data.note === null ? 'Removed' : 'Updated'} Component Note`,
				description: <span className="font-semibold">{data.Product.description}</span>
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
				title: 'Error Updating Component Note',
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
				componentId,
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
				{note?.length ? 'View' : 'Add'} <ScrollTextIcon className="ml-2 h-4 w-4" />
			</Button>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Blend Component Note</DialogTitle>
					<div className="flex justify-between">
						<div className="flex flex-col">
							<span className="font-semibold">{productCode}</span>
							<span>{productDescription}</span>
						</div>
						<div className="flex flex-col">
							<span className="border-b">Target Qty</span>
							<span className="font-semibold">{targetQuantity?.toFixed(2) ?? ''}</span>
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