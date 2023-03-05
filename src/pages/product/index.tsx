import rootStyles from '@/pages/index.module.css';
import { api } from '@/utils/api';
import { type NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import ProductList from './components/ProductList';

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
					<pre>{products.data ? `${products.data.length} products found.` : 'Loading...'}</pre>
					<Link href="product/add">Add Product</Link>
					{
						products.isLoading
							? <div>Loading...</div>
							: <ProductList products={products.data ?? []} />
					}
				</div>
			</main>
		</>
	);
};

export default ProductsHome;