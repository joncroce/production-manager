import styles from './view-blends.module.css';
import React from 'react';
import Form from '@/components/Form';
import Layout from '@/components/Layout';
import { api } from '@/utils/api';
import { useZodForm } from '@/hooks/useZodForm';
import { getBlendsByStatusSchema, type TGetBlendsByStatusSchema } from '@/schemas/blend';
import type { SubmitHandler } from 'react-hook-form';
import { authenticatedSSProps } from '@/server/auth';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const ViewBlends: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const form = useZodForm({
		schema: getBlendsByStatusSchema,
		mode: 'onBlur',
		defaultValues: {
			factoryId: user.factoryId,
			status: ['CREATED']
		},
		resetOptions: {
			keepDefaultValues: true
		}
	});

	form.watch('status');

	const submitForm: SubmitHandler<TGetBlendsByStatusSchema> = () => null;

	const blends = api.blend.getBlendsByStatus.useQuery(form.getValues(), { refetchOnWindowFocus: false });

	return (
		<main>
			<FormValues values={form.getValues()} />
			<details>
				<summary>Blends</summary>
				<pre>{JSON.stringify(blends.data, undefined, 2)}</pre>
			</details>
			<article className={styles['view-blends']}>
				<h1 className={styles['view-blends__header']}>View Blends</h1>
				<section className={styles['filter-blends']}>
					<h2 className={styles['filter-blends__header']}>Filter</h2>
					<Form className={styles['filter-blends__form']} form={form} onSubmit={submitForm}>
						<h3 className={styles['filter-blends__field-name']}>Status</h3>
						<fieldset className={styles['filter-blends__fieldset']}>
							<label className={styles['filter-blends__label']}>
								<input className={styles['filter-blends__input']} {...form.register('status')} type="checkbox" value="CREATED" />
								Created
							</label>
							<label className={styles['filter-blends__label']}>
								<input className={styles['filter-blends__input']} {...form.register('status')} type="checkbox" value="QUEUED" />
								Queued
							</label>
							<label className={styles['filter-blends__label']}>
								<input className={styles['filter-blends__input']} {...form.register('status')} type="checkbox" value="ASSEMBLING" />
								Assembling
							</label>
							<label className={styles['filter-blends__label']}>
								<input className={styles['filter-blends__input']} {...form.register('status')} type="checkbox" value="BLENDING" />
								Blending
							</label>
							<label className={styles['filter-blends__label']}>
								<input className={styles['filter-blends__input']} {...form.register('status')} type="checkbox" value="TESTING" />
								Testing
							</label>
							<label className={styles['filter-blends__label']}>
								<input className={styles['filter-blends__input']} {...form.register('status')} type="checkbox" value="ADJUSTING" />
								Adjusting
							</label>
							<label className={styles['filter-blends__label']}>
								<input className={styles['filter-blends__input']} {...form.register('status')} type="checkbox" value="PASSED" />
								Passed
							</label>
							<label className={styles['filter-blends__label']}>
								<input className={styles['filter-blends__input']} {...form.register('status')} type="checkbox" value="PUSHED" />
								Pushed
							</label>
							<label className={styles['filter-blends__label']}>
								<input className={styles['filter-blends__input']} {...form.register('status')} type="checkbox" value="FLAGGED" />
								Flagged
							</label>
							<label className={styles['filter-blends__label']}>
								<input className={styles['filter-blends__input']} {...form.register('status')} type="checkbox" value="COMPLETE" />
								Complete
							</label>
						</fieldset>
					</Form>
				</section>
			</article>
		</main>
	);
};

ViewBlends.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default ViewBlends;

const FormValues: React.FC<{ values: TGetBlendsByStatusSchema; }> = ({ values }) =>

	<details>
		<summary>Form Values</summary>
		<pre>{JSON.stringify(values, undefined, 2)}</pre>
	</details>;
