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

export default function BlendStatusSelector(
	{ factoryId, blendId, currentStatus, closeDialog }: {
		factoryId: string;
		blendId: string;
		currentStatus: TBlendStatus;
		closeDialog: () => void;
	}): React.JSX.Element {
	const utils = api.useContext();
	const statusOptions: Array<TBlendStatus> = [
		'CREATED', 'QUEUED', 'ASSEMBLING',
		'BLENDING', 'TESTING', 'ADJUSTING',
		'PASSED', 'PUSHED', 'FLAGGED', 'COMPLETE'
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
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			factoryId,
			id: blendId,
			status: currentStatus
		}
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

	return (
		<Form {...form}>
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
	);
};