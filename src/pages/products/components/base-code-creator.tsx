import React from 'react';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { addProductCodePartSchema } from '@/schemas/product';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormControl, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { z } from 'zod';

export default function BaseCodeCreator({
	factoryId,
	setSelectedBaseCode,
	close
}: {
	factoryId: string;
	setSelectedBaseCode: (v: number) => void;
	close: () => void;
}): React.JSX.Element {
	const utils = api.useContext();
	const { toast } = useToast();

	const addProductBase = api.productBase.add.useMutation({
		onSuccess(data) {
			toast({
				title: 'Added new Product Base',
				description: (
					<>
						<p className="font-semibold">{data.code}: {data.name}</p>
						<p>{data.description}</p>
					</>
				)
			});
			utils.productBase.getAll.invalidate({ factoryId })
				.then(() => {
					console.log('Invalidated product bases query.');
					setSelectedBaseCode(data.code);
				}).catch((error) => {
					console.error(error);
				}).finally(() => {
					close();
				});
		},
		onError(error) {
			toast({
				title: 'Error adding Product Base',
				description: error.message
			});

			console.error(error);
		}
	});

	const form = useForm<z.infer<typeof addProductCodePartSchema>>({
		resolver: zodResolver(addProductCodePartSchema),
		defaultValues: {
			factoryId
		}
	});

	function onSubmit(data: z.infer<typeof addProductCodePartSchema>): void {
		addProductBase.mutate(data);
	}

	function onCancel(): void {
		form.reset();
		close();
	}

	return (
		<Form {...form}>
			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit(onSubmit)(event);
				}}>
				<FormField
					control={form.control}
					name="code"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Base Code</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<div className="pt-6 flex justify-between align-center space-x-4">
					<Button type="button" variant='destructive' onClick={onCancel}>Cancel</Button>
					<Button type="submit">Save</Button>
				</div>
			</form>
		</Form>
	);
}