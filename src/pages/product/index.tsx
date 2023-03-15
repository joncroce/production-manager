import pageStyles from '@/pages/index.module.css';
import styles from './index.module.css';
import Head from 'next/head';
import Link from 'next/link';
import { z } from 'zod';
import { api } from '@/utils/api';
import { buildProductCode } from '@/utils/product';
import { ArrowTopRightIcon } from '@radix-ui/react-icons';
import SortableDataTable, { type SortType } from '@/components/SortableDataTable';
import type { NextPage } from 'next';
import type { inferRouterOutputs } from '@trpc/server';
import type { ProductRouter } from '@/server/api/routers/product';

type RouterOutput = inferRouterOutputs<ProductRouter>;
type ProductGetAllOutput = RouterOutput['getAll'];

const sortableProductSchema = z.object({
	code: z.string(),
	baseCodeId: z.number(),
	sizeCodeId: z.number(),
	variantCodeId: z.number(),
	quantityInStock: z.number().default(0),
	salesPrice: z.number().nullable(),
	description: z.string().default(''),
});

type SortableProduct = z.infer<typeof sortableProductSchema>;

const toSortable = (product: ProductGetAllOutput[number]): SortableProduct => {
	const { baseCodeId, sizeCodeId, variantCodeId, quantityInStock, salesPrice, description } = product;

	return {
		code: buildProductCode(baseCodeId, sizeCodeId, variantCodeId),
		baseCodeId,
		sizeCodeId,
		variantCodeId,
		quantityInStock: Number(quantityInStock ?? 0),
		salesPrice: salesPrice !== null ? Number(salesPrice) : null,
		description: String(description ?? ''),
	};
};

const fieldLabels: Map<keyof SortableProduct & string, string> = new Map(
	[
		['code', 'Code'],
		['baseCodeId', 'BaseId'],
		['sizeCodeId', 'SizeId'],
		['variantCodeId', 'VariantId'],
		['quantityInStock', 'Quantity'],
		['salesPrice', 'Price'],
		['description', 'Description'],
	]
);

const fieldSortTypes: Map<keyof SortableProduct & string, SortType> = new Map(
	[
		['code', 'alphabetic'],
		['baseCodeId', 'numeric'],
		['sizeCodeId', 'numeric'],
		['variantCodeId', 'numeric'],
		['quantityInStock', 'numeric'],
		['salesPrice', 'numeric'],
		['description', 'alphabetic'],
	]
);

const formatter = (product: SortableProduct): Map<keyof SortableProduct & string, string> => {
	const { code, baseCodeId, sizeCodeId, variantCodeId, quantityInStock, salesPrice, description } = product;

	return new Map(
		[
			['code', code],
			['baseCodeId', String(baseCodeId)],
			['sizeCodeId', String(sizeCodeId)],
			['variantCodeId', variantCodeId === 0 ? 'N/A' : String(variantCodeId)],
			['quantityInStock', String(quantityInStock)],
			['salesPrice', salesPrice !== null ? Number.parseFloat(salesPrice.toString()).toFixed(2) : 'NA'],
			['description', description],
		]
	);
};

const ProductsHome: NextPage = () => {
	const products = api.products.getAll.useQuery();

	return (
		<>
			<Head>
				<title>Products | Production Manager</title>
				<meta name="description" content="Products in the factory inventory." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main className={pageStyles.main}>
				<div className={pageStyles.container}>
					<ProductPageTitle />
					<div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
						<ProductCount count={products.data?.length} />
						<AddProductLink />
					</div>
					<SortableDataTable<SortableProduct>
						items={(products.data ?? []).map(toSortable)}
						itemLabel="Product"
						fieldLabels={fieldLabels}
						fieldSortTypes={fieldSortTypes}
						formatter={formatter}
					/>
				</div>
			</main>
		</>
	);
};

export default ProductsHome;

const ProductPageTitle: React.FC = () => <h2 className={styles.pageHeader}>Products</h2>;

const ProductCount: React.FC<{ count?: number; }> = ({ count }) =>
	count && count > 0
		? <span className={styles.productCount}><strong>{count}</strong> Product{count > 1 && 's'}</span>
		: null;

const AddProductLink: React.FC = () => <Link href="product/add" className={styles.addProductLink}>Add Product <ArrowTopRightIcon /></Link>;