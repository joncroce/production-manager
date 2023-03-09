import pageStyles from '@/pages/index.module.css';
import { type NextPage } from 'next';
import Head from 'next/head';
import { useRef } from 'react';
import AddProductForm from './components/AddProductForm';

const AddProductPage: NextPage = () => {
	const containerRef = useRef(null);

	return (
		<>
			<Head>
				<title>Create Product | Production Manager</title>
				<meta name="description" content="Create a new product for the factory inventory." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main className={pageStyles.main} ref={containerRef} >
				<section className={pageStyles.container}>
					<h2 className={pageStyles.header}>
						Add New Product
					</h2>
					<AddProductForm containerRef={containerRef} />
				</section>
			</main>
		</>
	);
};

export default AddProductPage;