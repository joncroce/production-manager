import { createServerSideHelpers } from '@trpc/react-query/server';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import { api } from '@/utils/api';
import superjson from '@/utils/superjson';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from './components/table/data-table';
import { columns, type TProductSummary } from './components/table/columns';
import { buildProductCode } from '@/utils/product';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';
import type { ProductRouterOutputs } from '@/server/api/routers/product';

function extendProducts(products: ProductRouterOutputs['getAll']): Array<TProductSummary> {
	return products.map(product => {
		const { baseCode, sizeCode, variantCode } = product;
		const productCode = buildProductCode(baseCode, sizeCode, variantCode);

		return {
			...product,
			productCode
		};
	});
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerAuthSession(context);

	return authenticatedSSProps(context)
		.then(async ({ props, redirect }) => {
			if (redirect) {
				return { props, redirect };
			}

			const helpers = createServerSideHelpers({
				router: appRouter,
				ctx: createInnerTRPCContext({ session }),
				transformer: superjson
			});

			await helpers.product.getAll.prefetch({ factoryId: props.user?.factoryId ?? '' });

			return {
				props: {
					...props,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		});
};

const ProductsPage: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const productsQuery = api.product.getAll.useQuery(
		{ factoryId: user?.factoryId ?? '' },
		{
			enabled: user.factoryId !== undefined,
			refetchOnWindowFocus: false,
		}
	);

	const { data: products } = productsQuery;

	if (!products) {
		throw new Error('Error retrieving products data.');
	}


	return (
		<>
			<div className="flex justify-between border-b p-2">
				<h2 className="text-3xl font-bold">Products</h2>

				<div className="flex items-end space-x-2 text-2xl">
					<Link href="products/add"><Button>Add Product</Button></Link>
				</div>
			</div>

			<div className="p-4">
				<Tabs defaultValue="viewAll">
					<TabsList>
						<TabsTrigger value="viewAll">View All</TabsTrigger>
					</TabsList>
					<TabsContent value="viewAll">
						<DataTable columns={columns} data={extendProducts(products)} usePagination={true} />
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
};

ProductsPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default ProductsPage;