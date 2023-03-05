import rootStyles from '@/pages/index.module.css';
import styles from './index.module.css';
import { api } from '@/utils/api';
import { type NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import ProductInventoryTable from './components/ProductInventoryTable';

const ProductsHome: NextPage = () => {
	const products = api.products.getAll.useQuery();

	return (
		<>
			<Head>
				<title>Products | Production Manager</title>
				<meta name="description" content="Products in the factory inventory." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main className={rootStyles.main}>
				<div className={rootStyles.container}>
					<ProductPageTitle />
					<div className={styles.flexRow}>
						<ProductCount count={products.data?.length} />
						<Link href="product/add">Add Product</Link>
					</div>
					{
						products.isLoading
							? <div>Loading...</div>
							: <ProductInventoryTable products={products.data} />
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
		: <></>;