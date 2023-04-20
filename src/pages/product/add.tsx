import styles from './add.module.css';
import Head from 'next/head';
import Layout from '@/components/Layout';
import AddProductForm from './components/AddProductForm';
import { useRef } from 'react';
import { authenticatedSSProps } from '@/server/auth';
import type { NextPageWithLayout } from '../_app';
import type { Session } from 'next-auth';
import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const AddProduct: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const containerRef = useRef(null);

	return user.factoryId ? (
		<>
			<Head>
				<title>Create Product | Production Manager</title>
				<meta name="description" content="Create a new product for the factory inventory." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<article className={styles['add-product']} ref={containerRef} >
				<h2 className={styles['add-product__header']}>
					Add New Product
				</h2>
				<AddProductForm factoryId={user.factoryId} containerRef={containerRef} />
			</article>
		</>
	) : null;
};

AddProduct.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default AddProduct;