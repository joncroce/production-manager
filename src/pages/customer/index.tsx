import rootStyles from '@/pages/index.module.css';
import styles from './index.module.css';
import Head from 'next/head';
import Link from 'next/link';
import { api } from '@/utils/api';

import type { NextPage } from 'next';

const CustomersHome: NextPage = () => {
	const customers = api.customers.getAll.useQuery();

	return (
		<>
			<Head>
				<title>Customers | Production Manager</title>
				<meta name="description" content="Our customers." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main className={rootStyles.main}>
				<div className={rootStyles.container}>
					<CustomerPageTitle />
					<div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
						<CustomerCount count={customers.data?.length} />
						<Link href="product/add">Add Product</Link>
					</div>
					{
						customers.isLoading
							? <div>Loading...</div>
							: <pre>{JSON.stringify(customers.data, undefined, 2)}</pre>
					}
				</div>
			</main>
		</>
	);
};

export default CustomersHome;

const CustomerPageTitle: React.FC = () => <h2 className={styles.pageHeader}>Customers</h2>;

const CustomerCount: React.FC<{ count?: number; }> = ({ count }) =>
	count && count > 0
		? <span className={styles.customerCount}><strong>{count}</strong> Customer{count > 1 && 's'}</span>
		: null;