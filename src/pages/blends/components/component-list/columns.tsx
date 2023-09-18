"use client";

import React, { useRef, useState } from 'react';
import { AlertOctagonIcon, ArrowUpDown, Edit2Icon, ScrollTextIcon } from 'lucide-react';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';
import type { ColumnDef, HeaderContext } from '@tanstack/react-table';

export type TBlendComponent = {
	id: string;
	blendId: string;
	productCode: string;
	productDescription: string;
	sourceTankName: string;
	targetQuantity: number;
	actualQuantity: number | null;
	note: string | null;
};

function sortableHeader(
	{ column }: HeaderContext<TBlendComponent, unknown>,
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

export const columns: ColumnDef<TBlendComponent>[] = [
	{
		accessorKey: 'productCode',
		header: (ctx) => sortableHeader(ctx, 'Code')
	},
	{
		accessorKey: 'productDescription',
		header: 'Description'
	},
	{
		accessorKey: 'sourceTankName',
		header: (ctx) => sortableHeader(ctx, 'Tank')
	},
	{
		accessorKey: 'targetQuantity',
		header: (ctx) => sortableHeader(ctx, 'Qty (Target)'),
		cell({ getValue }) {
			const targetQuantity = getValue<number>();
			const formatted = targetQuantity.toFixed(2);

			return <div>{formatted}</div>;
		},
	},
	{
		accessorKey: 'actualQuantity',
		header: (ctx) => sortableHeader(ctx, 'Qty (Actual)'),
		cell({ row, getValue }) {
			const { blendId, id: componentId } = row.original;
			const actualQuantity = getValue<number | undefined>();

			return <EditableActualQuantityCell actualQuantity={actualQuantity ?? undefined} blendId={blendId} componentId={componentId} />;
		}
	},
	{
		accessorKey: 'note',
		header: 'Note',
		cell({ row, getValue }) {
			const { blendId, id: componentId, productCode, productDescription, targetQuantity } = row.original;
			const note = getValue<string | undefined>();

			return <NoteCell
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

function EditableActualQuantityCell({
	actualQuantity,
	blendId,
	componentId,
}: {
	actualQuantity?: number;
	blendId: string;
	componentId: string;
}): React.JSX.Element {
	const initialValue = actualQuantity === undefined ? '' : actualQuantity.toFixed(2);
	const [value, setValue] = useState(initialValue);
	const inputRef = useRef<HTMLInputElement>(null);
	const mutation = api.blend.updateComponentActualQuantity.useMutation({
		onSuccess(data) {
			const updatedValue = data.actualQuantity === null ? undefined : data.actualQuantity.toFixed(2);
			setValue(updatedValue ?? '');

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
		},
		onError(error) {
			toast({
				title: 'Error Updating Component Actual Quantity',
				description: error.message
			});
			console.error(error);
		}
	});

	const utils = api.useContext();
	const { toast } = useToast();

	const handleBlur: React.FocusEventHandler<HTMLInputElement> | undefined = () => {
		if (inputRef.current) {
			const value = inputRef.current.value;
			if (value !== initialValue) {
				const updatedValue = !value.length ? undefined : parseFloat(value);

				mutation.mutate({
					blendId,
					componentId,
					actualQuantity: updatedValue
				});
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
				inputRef.current.blur();
			}
		}
	};

	return (
		<Input ref={inputRef} size={10} value={value} onChange={(e) => setValue(e.target.value)} onBlur={handleBlur} onKeyDownCapture={handleKeyDown} />
	);
}

function NoteCell({
	note, blendId, componentId, productCode, productDescription, targetQuantity
}: {
	note?: string;
	blendId: string;
	componentId: string;
	productCode: string;
	productDescription: string;
	targetQuantity: number;
}): React.JSX.Element {
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState(!note?.length);
	const [text, setText] = useState(note ?? '');
	const [showAlert, setShowAlert] = useState(false);

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
			setShowAlert(true);
		} else {
			setText(note ?? '');
			setEditing(!note?.length);
			setOpen(open);
		}
	}

	return (
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
							<span className="font-semibold">{targetQuantity.toFixed(2)}</span>
						</div>
					</div>
				</DialogHeader>

				{showAlert
					? <AlertDialog>
						<AlertDialogHeader>
							<AlertDialogTitle className="flex justify-start items-stretch space-x-2"><AlertOctagonIcon className="stroke-white text-red-500" /><span className="font-semibold">Note has unsaved changes!</span></AlertDialogTitle>
							<AlertDialogDescription>
								Press <span className="font-semibold">Cancel</span> to return to editing this note, or <span className="font-semibold">Confirm</span> to discard changes.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<Button variant='outline' onClick={() => setShowAlert(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => {
									setShowAlert(false);
									setOpen(false);
									setEditing(!note?.length);
									setText(note ?? '');
								}}
							>Confirm</Button>
						</AlertDialogFooter>
					</AlertDialog>
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
							<Button variant="outline" onClick={() => setEditing(true)}>
								Edit <Edit2Icon className="ml-2 h-4 w-4" />
							</Button>
						</>
				}

			</DialogContent>
		</Dialog>
	);
}