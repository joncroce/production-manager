import rootStyles from '@/pages/index.module.css';
import { type NextPage } from 'next';
import Head from 'next/head';
import { useRef } from 'react';
import AddCustomerForm from './components/AddCustomerForm';

const AddProductPage: NextPage = () => {
	const containerRef = useRef(null);

	return (
		<>
			<Head>
				<title>Add Customer | Production Manager</title>
				<meta name="description" content="Add a new customer." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main className={rootStyles.main} ref={containerRef} >
				<section className={rootStyles.container}>
					<h2 className={rootStyles.header}>
						Add New Customer
					</h2>
					<AddCustomerForm />
				</section>
			</main>
		</>
	);
};

export default AddProductPage;