import React from 'react';
import FactorySeeder from '../FactorySeeder';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FactoryRouterInputs } from '@/server/api/routers/factory';
import { Checkbox } from '@/components/ui/checkbox';

function FactoryCreator({
	userId,
	onFactoryCreated
}: {
	userId: string;
	onFactoryCreated: () => void;
}): React.JSX.Element {
	const [inProgress, setInProgress] = React.useState(false);
	const factorySeederRef = React.useRef<
		{
			startSeeding: (factoryId: string, onSuccess: () => void) => void;
		} | null
	>(null);

	const { toast } = useToast();

	const schema = z.object({
		name: z.string().min(1),
		seed: z.boolean().default(true).optional(),
	});
	type TSchema = z.infer<typeof schema>;

	const form = useForm<TSchema>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: '',
			seed: true
		}
	});

	function onSubmit(data: TSchema): void {
		setInProgress(true);

		const newFactory: FactoryRouterInputs['add'] = {
			userId,
			...data
		};

		addFactory.mutate(newFactory);
	}

	const addFactory = api.factory.add.useMutation({
		onSuccess(data) {
			toast({
				title: 'Factory Created',
				description: `New factory "${data.name}" successfully created.`
			});
			if (!form.getValues('seed')) {
				onFactoryCreated();
			} else {
				initSeeding(data.id);
			}
		},
		onError(error) {
			toast({
				title: 'Error Creating Factory',
				description: error.message
			});
			setInProgress(false);
		},
	});

	function initSeeding(factoryId: string) {
		if (factorySeederRef.current)
			factorySeederRef.current.startSeeding(factoryId, onFactoryCreated);
	}


	return (
		<div className="p-4">
			<h3 className="my-4 text-2xl font-semibold">Factory Creator</h3>

			{!inProgress
				? <Form {...form}>
					<form
						className="my-6 flex flex-col space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							void form.handleSubmit(onSubmit)(event);
						}}
					>
						<FormDescription>
							<p>To use <strong>Production Manager</strong>, you first need to create a factory.</p>
						</FormDescription>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>Factory Name</FormLabel>
										<FormControl>
											<Input value={field.value} onChange={field.onChange} />
										</FormControl>
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name="seed"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>
											Seed Factory
										</FormLabel>
										<FormDescription>
											<p>Seed new factory with items that include predefined Products, Formulas, Blends, etc.</p>
											<p>Highly recommended for users new to Product Manager.</p>
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
						<Button type="submit" disabled={inProgress || !form.formState.isValid}>Create Factory</Button>
					</form>
				</Form>
				: null}

			<FactorySeeder ref={factorySeederRef} />
		</div>
	);
};

export default FactoryCreator;;