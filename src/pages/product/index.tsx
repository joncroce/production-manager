import styles from './index.module.css';
import Head from 'next/head';
import Layout from '@/components/Layout';
import Link from 'next/link';
import SortableDataTable, { type SortType } from '@/components/SortableDataTable';
import { ArrowTopRightIcon } from '@radix-ui/react-icons';
import { z } from 'zod';
import { authenticatedSSProps } from '@/server/auth';
import { api } from '@/utils/api';
import { buildProductCode } from '@/utils/product';
import type { PropsWithChildren } from 'react';
import type { GetServerSideProps } from 'next';
import type { inferRouterOutputs } from '@trpc/server';
import type { ProductRouter } from '@/server/api/routers/product';
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';

type RouterOutput = inferRouterOutputs<ProductRouter>;
type ProductGetAllOutput = RouterOutput['getAll'];

const sortableProductSchema = z.object({
	code: z.string(),
	baseCode: z.number(),
	sizeCode: z.number(),
	variantCode: z.number(),
	quantityInStock: z.number().default(0),
	salesPrice: z.number().nullable(),
	description: z.string().default(''),
});

type TSortableProductSchema = z.infer<typeof sortableProductSchema>;

const toSortable = (product: ProductGetAllOutput[number]): TSortableProductSchema => {
	const { baseCode, sizeCode, variantCode, quantityInStock, salesPrice, description } = product;

	return {
		code: buildProductCode(baseCode, sizeCode, variantCode),
		baseCode,
		sizeCode,
		variantCode,
		quantityInStock: Number(quantityInStock ?? 0),
		salesPrice: salesPrice !== null ? Number(salesPrice) : null,
		description: String(description ?? ''),
	};
};

const fieldLabels: Map<keyof TSortableProductSchema & string, string> = new Map(
	[
		['code', 'Code'],
		['baseCode', 'BaseCode'],
		['sizeCode', 'SizeCode'],
		['variantCode', 'VariantCode'],
		['quantityInStock', 'Quantity'],
		['salesPrice', 'Price'],
		['description', 'Description'],
	]
);

const fieldSortTypes: Map<keyof TSortableProductSchema & string, SortType> = new Map(
	[
		['code', 'alphabetic'],
		['baseCode', 'numeric'],
		['sizeCode', 'numeric'],
		['variantCode', 'numeric'],
		['quantityInStock', 'numeric'],
		['salesPrice', 'numeric'],
		['description', 'alphabetic'],
	]
);

const formatter = (product: TSortableProductSchema): Map<keyof TSortableProductSchema & string, string> => {
	const { code, baseCode, sizeCode, variantCode, quantityInStock, salesPrice, description } = product;

	return new Map(
		[
			['code', code],
			['baseCode', String(baseCode)],
			['sizeCode', String(sizeCode)],
			['variantCode', variantCode === 0 ? 'N/A' : String(variantCode)],
			['quantityInStock', String(quantityInStock)],
			['salesPrice', salesPrice !== null ? Number.parseFloat(salesPrice.toString()).toFixed(2) : 'NA'],
			['description', description],
		]
	);
};

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const ProductHome: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const products = api.product.getAll.useQuery({ factoryId: user.factoryId ?? '' }, { enabled: Boolean(user.factoryId) });

	return (
		<>
			<Head>
				<title>Products | Production Manager</title>
				<meta name="description" content="Products in the factory inventory." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main>
				<article className={styles['products']}>
					<h1 className={styles['products__header']}>Products</h1>
					<ProductsControls isReady={products.isSuccess}>
						<ProductCount count={products.data?.length} />
						<AddProductLink />
					</ProductsControls>
					<SortableDataTable<TSortableProductSchema>
						items={(products.data ?? []).map(toSortable)}
						itemLabel="Product"
						fieldLabels={fieldLabels}
						fieldSortTypes={fieldSortTypes}
						formatter={formatter}
					/>
				</article>
			</main>
		</>
	);
};

ProductHome.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default ProductHome;

const ProductsControls: React.FC<{
	isReady: boolean;
} & PropsWithChildren> = ({ children, isReady = false, ...props }) => {
	return isReady
		? <div {...props} className={styles['products__controls']}>
			{children}
		</div>
		: null;
};

const ProductCount: React.FC<{ count?: number; }> = ({ count }) =>
	count && count > 0
		? <span className={styles.productCount}><strong>{count}</strong> Product{count > 1 && 's'}</span>
		: null;

const AddProductLink: React.FC = () => <Link href="product/add" className={styles.addProductLink}>Add Product <ArrowTopRightIcon /></Link>;