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
import React from 'react';

export default function DestinationTankSelector(
	{
		factoryId, blendId, baseCode, currentDestinationTankName, closeDialog
	}: {
		factoryId: string;
		blendId: string;
		baseCode: number;
		currentDestinationTankName: string | null;
		closeDialog: () => void;
	}
): React.JSX.Element {
	const utils = api.useContext();
	const tanks = api.tank.getDestinationTanks.useQuery({ factoryId, baseCode });
	const updateDestinationTank = api.blend.updateDestinationTank.useMutation({
		onSuccess(data) {
			toast({
				title: `${data.destinationTankName ? 'Updated' : 'Removed'} Destination Tank`,
				description: data.destinationTankName
			});

			utils.blend.get
				.invalidate({ id: blendId })
				.then(() => { console.log('Invalidated blend query'); })
				.catch((error) => { console.error(error); })
				.finally(() => { closeDialog(); });
		},
		onError(error) {
			toast({
				title: 'Error Updating Destination Tank',
				description: error.message
			});

			console.error(error);
		}
	});

	const { toast } = useToast();

	const schema = z.custom<BlendRouterInputs['updateDestinationTank']>();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			factoryId,
			id: blendId,
			destinationTankName: currentDestinationTankName ?? ''
		}
	});

	function onSubmit(data: z.infer<typeof schema>): void {
		const current = currentDestinationTankName ?? undefined;
		const updated = data.destinationTankName?.length ? data.destinationTankName : undefined;
		if (updated !== current) {
			updateDestinationTank.mutate(data);
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
					name="destinationTankName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Destination Tank</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Destination Tank" />
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
}