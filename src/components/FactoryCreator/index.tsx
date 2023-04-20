import styles from './index.module.css';
import React, { useState } from 'react';
import Form from '../Form';
import FactorySeeder from '../FactorySeeder';
import { api } from '@/utils/api';
import { useZodForm } from '@/hooks/useZodForm';
import { addFactorySchema, type TAddFactorySchema } from '@/schemas/factory';
import type { SubmitHandler } from 'react-hook-form';

interface TAddFactoryStatus {
	value: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';
	message: string;
}

const FactoryCreator: React.FC<{ userId: string; }> = ({ userId }) => {
	const [factoryId, setFactoryId] = useState<string>();
	const [status, setStatus] = useState<TAddFactoryStatus>({ value: 'IDLE', message: '' });
	const utils = api.useContext();

	const form = useZodForm({
		schema: addFactorySchema,
		defaultValues: {
			name: '',
			userId: userId
		},
		resetOptions: {
			keepDefaultValues: true
		}
	});

	const addFactory = api.factory.add.useMutation({
		onSuccess(data) {
			setStatus({ value: 'SUCCESS', message: `Successfully created factory ${data.name}` });
			setFactoryId(data.id);
			utils.user.getFactory.invalidate({ userId })
				.then(() => {
					console.log("Invalidated user.getFactory queries.");
				})
				.catch((error) => {
					console.error(error);
				});
		},
		onError(error) {
			setStatus({ value: 'ERROR', message: `Error creating factory: ${error.message}` });
		},
	});

	const submitForm: SubmitHandler<TAddFactorySchema> = (data) => {
		setStatus({ value: 'LOADING', message: "Creating factory..." });
		addFactory.mutate(data);
	};

	return (
		<section className={styles['factory-creator']}>
			<pre>{JSON.stringify(form.getValues(), undefined, 2)}</pre>
			<h2 className={styles['factory-creator__header']}>Factory Starter</h2>
			<p>To use <strong>Production Manager</strong>, you first need to create a factory.</p>
			<p>While you can choose to start from a blank slate with an empty factory, it is recommended that you first familiarize yourself with <strong>Production Manager</strong> by letting us bootstrap a factory for you that includes predefined Products, Formulas, Blends, etc.</p>
			<AddFactoryStatus status={status} />
			{
				!factoryId
					? <Form
						form={form}
						onSubmit={submitForm}
					>
						<label className={styles['factory-creator__label']} htmlFor="name">
							Name
						</label>
						<input className={styles['factory-creator__input']} type="text" id="name" {...form.register('name')} />
						<button className={styles['factory-creator__button']} type="submit" disabled={status.value === 'LOADING'}>
							Create Factory
						</button>
					</Form>
					: <FactorySeeder factoryId={factoryId} />
			}

		</section>
	);
};

export default FactoryCreator;

const AddFactoryStatus: React.FC<{
	status: TAddFactoryStatus;
}> = ({ status }) => {
	return (
		<span>{status.message}</span>
	);
};
