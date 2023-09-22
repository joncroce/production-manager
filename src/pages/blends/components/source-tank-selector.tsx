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

export default function SourceTankSelector(
	{
		factoryId,
		blendId,
		componentId,
		baseCode,
		currentSourceTankName,
		closeDialog
	}: {
		factoryId: string;
		blendId: string;
		componentId: string;
		baseCode: number;
		currentSourceTankName: string;
		closeDialog: () => void;
	}
): React.JSX.Element {
	const utils = api.useContext();
	const tanks = api.tank.getSourceTanks.useQuery({ factoryId, baseCode });
	const updateSourceTank = api.blend.updateComponentSourceTank.useMutation({
		onSuccess(data) {
			toast({
				title: 'Updated Component Source Tank',
				description: data.sourceTankName
			});

			utils.blend.get
				.invalidate({ id: blendId })
				.then(() => { console.log('Invalidated blend query'); })
				.catch((error) => { console.error(error); })
				.finally(() => { closeDialog(); });
		},
		onError(error) {
			toast({
				title: 'Error Updating Component Source Tank',
				description: error.message
			});

			console.error(error);
		}
	});

	const { toast } = useToast();

	const schema = z.custom<BlendRouterInputs['updateComponentSourceTank']>();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			factoryId,
			blendId,
			componentId,
			sourceTankName: currentSourceTankName
		}
	});

	function onSubmit(data: z.infer<typeof schema>): void {
		const current = currentSourceTankName;
		const updated = data.sourceTankName;
		if (updated !== current) {
			updateSourceTank.mutate(data);
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
					name="sourceTankName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Available Source Tanks</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
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