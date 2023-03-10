import pageStyles from '@/pages/index.module.css';
import styles from './index.module.css';
import Head from 'next/head';
import Link from 'next/link';
import { api } from '@/utils/api';
import useProductSorter from '@/hooks/useSorter';
import { formatForView, labelsByField } from '@/utils/product';
import ProductInventory from './components/ProductInventory';
import Sorter from '@/components/Sorter';
import type { NextPage } from 'next';
import type { ViewProduct } from '@/schemas/product';
import { ArrowTopRightIcon } from '@radix-ui/react-icons';

const ProductsHome: NextPage = () => {
	const products = api.products.getAll.useQuery();
	const { addSort, removeSort, moveSort, reverseSortDirection, resetSorts, getSorts, performSorts } = useProductSorter<ViewProduct>();

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
					<Sorter<ViewProduct>
						labels={labelsByField}
						sorts={getSorts()}
						moveSort={moveSort}
						resetSorts={resetSorts}
					/>
					{
						products.isLoading
							? <div>Loading...</div>
							: <ProductInventory
								products={
									(products.data ?? [])
										.sort(performSorts)
										.map(formatForView)
								}
								sorts={getSorts()}
								addSort={addSort}
								removeSort={removeSort}
								reverseSortDirection={reverseSortDirection}
							/>
					}
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