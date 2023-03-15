import pageStyles from '@/pages/index.module.css';
import styles from './index.module.css';
import Head from 'next/head';
import Link from 'next/link';
import dayjs from 'dayjs';
import { z } from 'zod';
import { api } from '@/utils/api';
import { ArrowTopRightIcon } from '@radix-ui/react-icons';
import SortableDataTable, { type SortType } from '@/components/SortableDataTable';
import type { NextPage } from 'next';
import type { inferRouterOutputs } from '@trpc/server';
import type { CustomerRouter } from '@/server/api/routers/customer';

type RouterOutput = inferRouterOutputs<CustomerRouter>;
type CustomerGetAllOutput = RouterOutput['getAll'];

const sortableCustomerSchema = z.object({
	id: z.number(),
	name: z.string(),
	orderCount: z.number(),
	mostRecentOrder: z.number().nullable(),
});

type SortableCustomer = z.infer<typeof sortableCustomerSchema>;

const toSortable = (customer: CustomerGetAllOutput[number]): SortableCustomer => ({
	id: customer.id,
	name: customer.name,
	orderCount: customer._count.Orders,
	mostRecentOrder: customer.Orders[0]?.orderedOn.valueOf() ?? null
});

const fieldLabels: Map<keyof SortableCustomer & string, string> = new Map(
	[
		['id', 'ID'],
		['name', 'Name'],
		['orderCount', 'Total Orders'],
		['mostRecentOrder', 'Most Recent Order']
	]
);

const fieldSortTypes: Map<keyof SortableCustomer & string, SortType> = new Map(
	[
		['id', 'numeric'],
		['name', 'alphabetic'],
		['orderCount', 'numeric'],
		['mostRecentOrder', 'numeric']
	]
);

const formatter = (customer: SortableCustomer) => {
	const { id, name, orderCount, mostRecentOrder } = customer;
	return new Map<keyof SortableCustomer & string, string>(
		[
			['id', String(id)],
			['name', name],
			['orderCount', String(orderCount)],
			['mostRecentOrder', mostRecentOrder !== null ? dayjs(mostRecentOrder).toString() : 'N/A']
		]
	);
};

const CustomersHome: NextPage = () => {
	const customers = api.customers.getAll.useQuery();

	return (
		<>
			<Head>
				<title>Customers | Production Manager</title>
				<meta name="description" content="Our customers." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main className={pageStyles.main}>
				<div className={pageStyles.container}>
					<CustomerPageTitle />
					<div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
						<CustomerCount count={customers.data?.length} />
						<AddCustomerLink />
					</div>
					<SortableDataTable<SortableCustomer>
						items={(customers.data ?? []).map(toSortable)}
						itemLabel="Customer"
						fieldLabels={fieldLabels}
						fieldSortTypes={fieldSortTypes}
						formatter={formatter}
					/>
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

const AddCustomerLink: React.FC = () => <Link href="customer/add" className={styles.addCustomerLink}>Add Customer <ArrowTopRightIcon /></Link>;