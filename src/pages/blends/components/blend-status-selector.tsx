import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BlendRouterInputs } from '@/server/api/routers/blend';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import type { TBlendStatus } from '@/schemas/blend';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangleIcon } from 'lucide-react';

export default function BlendStatusSelector(
	{ factoryId, blendId, currentStatus, closeDialog }: {
		factoryId: string;
		blendId: string;
		currentStatus: TBlendStatus;
		closeDialog: () => void;
	}): React.JSX.Element {
	const [showDangerousSelector, setShowDangerousSelector] = useState(false);
	const utils = api.useContext();
	const statusOptions: Array<TBlendStatus> = [
		'CREATED', 'QUEUED', 'ASSEMBLING',
		'BLENDING', 'TESTING', 'ADJUSTING',
		'PASSED', 'PUSHING', 'FLAGGED', 'COMPLETE'
	];
	const updateBlendStatus = api.blend.updateBlendStatus.useMutation({
		onSuccess(data) {
			toast({
				title: 'Updated Blend Status',
				description: data.status
			});

			utils.blend.get.invalidate({ id: blendId }).then(() => {
				console.log('Invalidated blend query.');
			}).catch((error) => {
				console.error(error);
			});

			closeDialog();
		},
		onError(error) {
			toast({
				title: 'Error Updating Blend Status',
				description: error.message
			});
			console.error(error);
		}
	});

	const { toast } = useToast();

	const schema = z.custom<BlendRouterInputs['updateBlendStatus']>();
	const defaultValues: z.infer<typeof schema> = {
		factoryId,
		id: blendId,
		status: currentStatus
	};
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues
	});

	function onSubmit(data: z.infer<typeof schema>): void {
		if (data.status !== currentStatus) {
			updateBlendStatus.mutate({
				...data,
			});
		} else {
			closeDialog();
		}
	}

	function getStatusChangeOptions(currentStatus: TBlendStatus): Array<TBlendStatus> {
		switch (currentStatus) {
			case 'CREATED': return ['QUEUED', 'ASSEMBLING'];
			case 'QUEUED': return ['CREATED', 'ASSEMBLING'];
			case 'ASSEMBLING': return ['BLENDING'];
			case 'BLENDING': return ['TESTING'];
			case 'TESTING': return ['ADJUSTING', 'PASSED'];
			case 'ADJUSTING': return ['BLENDING'];
			case 'PASSED': return ['PUSHING'];
			case 'PUSHING': return ['COMPLETE'];
			case 'FLAGGED': return statusOptions.filter(status => status !== 'FLAGGED');
			default: return statusOptions;
		}
	}

	return (
		<>
			<div>
				<h3 className="font-semibold text-xl text-center">Current Status: <span className="font-bold">{currentStatus}</span></h3>
				<p className="my-2 text-sm font-medium leading-none">
					Click one of the following available options to change the blend status:
				</p>
			</div>
			<div className="grid grid-cols-2 gap-4">
				{getStatusChangeOptions(currentStatus).map((status) => (
					<Button key={status} onClick={() => onSubmit({ ...defaultValues, status })}>{status}</Button>
				))}
				<Button variant='destructive' onClick={() => onSubmit({ ...defaultValues, status: 'FLAGGED' })}>FLAGGED</Button>
			</div>
			<div className="mt-2 pt-4 border-t">
				<div className="items-top flex space-x-2">
					<Checkbox id="showDangerousSelector" checked={showDangerousSelector} onCheckedChange={() => setShowDangerousSelector((prev) => !prev)} />
					<div className="grid gap-1.5 leading-none">
						<label
							htmlFor="showDangerousSelector"
							className="flex justify-start items-center space-x-1 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							<span className="text-sm font-medium leading-none">Show all status options.</span>
							<AlertTriangleIcon className="stroke-white text-yellow-500" />
						</label>
						<span className="text-sm text-muted-foreground">
							Warning: Only use if strictly necessary and you are aware of potential side-effects.
						</span>
					</div>
				</div>
				{showDangerousSelector
					? <Form {...form}>
						<form onSubmit={(event) => {
							event.preventDefault();
							void form.handleSubmit(onSubmit)(event);
						}}>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Blend Status</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Blend Tank" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{
													statusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)
												}
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
							<div className="flex justify-between align-center pt-6">
								<Button type="button" variant='destructive' onClick={closeDialog}>Cancel</Button>
								<Button type="submit">Save</Button>
							</div>
						</form>
					</Form>
					: null}
			</div>
		</>
	);
};