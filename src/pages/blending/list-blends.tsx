import styles from './list-blends.module.css';
import React, { forwardRef } from 'react';
import Layout from '@/components/Layout';
import Form from '@/components/Form';
import Link from 'next/link';
import SortableDataTable, { type SortType } from '@/components/SortableDataTable';
import { authenticatedSSProps } from '@/server/auth';
import { api } from '@/utils/api';
import { useZodForm } from '@/hooks/useZodForm';
import { z } from 'zod';
import { buildProductCode } from '@/utils/product';
import {
	blendStatusSchema, getBlendsByStatusSchema,
	type TBlendStatusSchema, type TGetBlendsByStatusSchema
} from '@/schemas/blend';
import type { ReactNode, ComponentProps } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';
import type { Blend as TBlend } from '@prisma/client';

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const ListBlends: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const filterForm = useZodForm({
		schema: getBlendsByStatusSchema,
		mode: 'onBlur',
		defaultValues: {
			factoryId: user.factoryId,
			status: ['CREATED', 'QUEUED', 'ASSEMBLING', 'BLENDING', 'TESTING', 'ADJUSTING', 'PASSED', 'PUSHED', 'FLAGGED', 'COMPLETE']
		},
		resetOptions: {
			keepDefaultValues: true
		}
	});

	filterForm.watch('status');

	const blends = api.blend.getBlendsByStatus.useQuery(filterForm.getValues(), { refetchOnWindowFocus: false });

	return (
		<main>
			<article className={styles['view-blends']}>
				<h1 className={styles['view-blends__header']}>List of Blends</h1>
				<FilterBlends form={filterForm} />
				{blends.isFetched && blends.data
					? <BlendList blends={blends.data} />
					: null}
			</article>
		</main>
	);
};

ListBlends.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default ListBlends;

const FilterBlends: React.FC<{
	form: UseFormReturn<TGetBlendsByStatusSchema>;
}> = ({ form }) => (
	<section className={styles['filter-blends']}>
		<h2 className={styles['filter-blends__header']}>Filter</h2>
		<Form className={styles['filter-blends__form']} form={form} onSubmit={() => null}>
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

const BlendList: React.FC<{
	blends: TBlend[];
}> = ({ blends }) => {
	const sortableBlendSchema = z.object({
		id: z.string(),
		productCode: z.string(),
		targetQuantity: z.coerce.number(),
		actualQuantity: z.coerce.number().optional(),
		blendTankName: z.string().optional(),
		destinationTankName: z.string().optional(),
		note: z.string().optional(),
		status: z.string()
	});
	type TSortableBlendSchema = z.infer<typeof sortableBlendSchema>;

	const toSortable = (blend: TBlend): TSortableBlendSchema => {
		const { id, baseCode, sizeCode, variantCode, targetQuantity, actualQuantity, blendTankName, destinationTankName, note, status } = blend;

		return {
			productCode: buildProductCode(baseCode, sizeCode, variantCode),
			targetQuantity: Number(targetQuantity),
			actualQuantity: actualQuantity !== null ? Number(actualQuantity) : undefined,
			blendTankName: blendTankName !== null ? blendTankName : undefined,
			destinationTankName: destinationTankName !== null ? destinationTankName : undefined,
			note: note ?? '',
			status,
			id
		};
	};

	const fieldLabels: Map<keyof TSortableBlendSchema & string, string | null> = new Map(
		[
			['productCode', 'Product Code'],
			['targetQuantity', 'Qty (Target)'],
			['actualQuantity', 'Qty (Actual)'],
			['blendTankName', 'Tank (Blending)'],
			['destinationTankName', 'Tank (Destination)'],
			['note', 'Note'],
			['status', 'Status'],
			['id', null]
		]
	);

	const fieldSortTypes: Map<keyof TSortableBlendSchema & string, SortType> = new Map(
		[
			['productCode', 'alphabetic'],
			['targetQuantity', 'numeric'],
			['actualQuantity', 'numeric'],
			['blendTankName', 'alphabetic'],
			['destinationTankName', 'alphabetic'],
			['note', 'alphabetic'],
			['status', 'alphabetic'] // TODO: Custom sort type
		]
	);

	const formatter = (blend: TSortableBlendSchema): Map<keyof TSortableBlendSchema & string, string | ReactNode> => {
		const { id, productCode, targetQuantity, actualQuantity, blendTankName, destinationTankName, note, status } = blend;
		const defaultUndefinedPlaceholder = '---';

		return new Map(
			[
				['productCode', productCode],
				['targetQuantity', targetQuantity.toString()],
				['actualQuantity', actualQuantity !== undefined ? actualQuantity.toString() : defaultUndefinedPlaceholder],
				['blendTankName', blendTankName !== undefined ? blendTankName : defaultUndefinedPlaceholder],
				['destinationTankName', destinationTankName !== undefined ? destinationTankName : defaultUndefinedPlaceholder],
				['note', note ?? ''],
				['status', status],
				['id', (<Link key={id} href={`/blend/${id}`}>View</Link>) as ReactNode]
			]
		);
	};

	return (
		<SortableDataTable<TSortableBlendSchema>
			items={blends.map(toSortable)}
			itemLabel="Blend"
			fieldLabels={fieldLabels}
			fieldSortTypes={fieldSortTypes}
			formatter={formatter}
		/>
	);
};