import styles from './view-blends.module.css';
import React, { type ComponentProps, forwardRef } from 'react';
import Form from '@/components/Form';
import Layout from '@/components/Layout';
import { authenticatedSSProps } from '@/server/auth';
import { api } from '@/utils/api';
import { useZodForm } from '@/hooks/useZodForm';
import {
	blendStatusSchema, getBlendsByStatusSchema,
	type TBlendStatusSchema, type TGetBlendsByStatusSchema
} from '@/schemas/blend';
import type { SubmitHandler, UseFormReturn } from 'react-hook-form';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const ViewBlends: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const filterForm = useZodForm({
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

	filterForm.watch('status');

	const submitFilterForm: SubmitHandler<TGetBlendsByStatusSchema> = () => null;

	const blends = api.blend.getBlendsByStatus.useQuery(filterForm.getValues(), { refetchOnWindowFocus: false });

	return (
		<main>
			<FormValues values={filterForm.getValues()} />
			<details>
				<summary>Blends</summary>
				<pre>{JSON.stringify(blends.data, undefined, 2)}</pre>
			</details>
			<article className={styles['view-blends']}>
				<h1 className={styles['view-blends__header']}>View Blends</h1>
				<FilterBlends form={filterForm} submitForm={submitFilterForm} />
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

const FilterBlends: React.FC<{
	form: UseFormReturn<TGetBlendsByStatusSchema>;
	submitForm: SubmitHandler<TGetBlendsByStatusSchema>;
}> = ({ form, submitForm }) => (
	<section className={styles['filter-blends']}>
		<h2 className={styles['filter-blends__header']}>Filter</h2>
		<Form className={styles['filter-blends__form']} form={form} onSubmit={submitForm}>
			<h3 className={styles['filter-blends__field-name']}>Status</h3>
			<fieldset className={styles['filter-blends__fieldset']}>
				{
					Object.values(blendStatusSchema.Values).map((status) => (
						<FilterFormField {...form.register('status')} key={status} status={status} />
					))
				}
			</fieldset>
		</Form>
	</section>
);

const FilterFormField = forwardRef<HTMLInputElement, { status: TBlendStatusSchema; } & ComponentProps<'input'>>(({ status, ...props }, ref) => (
	<label className={styles['filter-blends__label']} htmlFor={status}>
		<input className={styles['filter-blends__input']} type="checkbox" id={status} {...props} ref={ref} value={status} />
		{status.charAt(0).concat(status.slice(1).toLowerCase())}
	</label>
));
FilterFormField.displayName = 'FilterFormField';

const FormValues: React.FC<{ values: TGetBlendsByStatusSchema; }> = ({ values }) =>

	<details>
		<summary>Form Values</summary>
		<pre>{JSON.stringify(values, undefined, 2)}</pre>
	</details>;
