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

export default function BlendTankSelector(
	{ factoryId, blendId, currentBlendTankName, closeDialog }: {
		factoryId: string;
		blendId: string;
		currentBlendTankName: string | null;
		closeDialog: () => void;
	}): React.JSX.Element {
	const utils = api.useContext();
	const tanks = api.tank.getBlendTanks.useQuery({ factoryId });
	const updateBlendTank = api.blend.updateBlendTank.useMutation({
		onSuccess(data) {
			toast({
				title: 'Updated Blend Tank',
				description: data.blendTankName
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
				title: 'Error Updating Blend Tank',
				description: error.message
			});
			console.error(error);
		}
	});

	const { toast } = useToast();

	const schema = z.custom<BlendRouterInputs['updateBlendTank']>();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			factoryId,
			id: blendId,
			blendTankName: currentBlendTankName ?? undefined
		}
	});

	function onSubmit(data: z.infer<typeof schema>): void {
		if (data.blendTankName !== currentBlendTankName) {
			updateBlendTank.mutate({
				...data,
				blendTankName: data.blendTankName?.length ? data.blendTankName : undefined
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
					name="blendTankName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Blend Tank</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Blend Tank" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={''}>(No Tank)</SelectItem>
									{
										tanks.data?.map((tank) => <SelectItem key={tank.name} value={tank.name}>{tank.name}</SelectItem>)
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