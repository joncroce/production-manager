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
import { DataTable } from './components/blend-list/data-table';
import { type TBlendSummary, columns } from './components/blend-list/columns';
import { ACTIVE_BLEND_STATUSES } from '@/schemas/blend';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';

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

			await helpers.blend.getAll.prefetch({ factoryId: props.user?.factoryId ?? '' });

			return {
				props: {
					...props,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		});
};

function getCurrentlyActive(blends: Array<TBlendSummary>): Array<TBlendSummary> {
	return blends.filter(({ status }) => ACTIVE_BLEND_STATUSES.includes(status));
}

const BlendsPage: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const blendsQuery = api.blend.getAll.useQuery(
		{ factoryId: user?.factoryId ?? '' },
		{
			enabled: user.factoryId !== undefined,
			refetchOnWindowFocus: false,
		}
	);

	const { data: blends } = blendsQuery;

	if (!blends) {
		throw new Error('Error retrieving blends data.');
	}

	return (
		<>
			<div className="flex justify-between border-b p-2">
				<h2 className="text-3xl font-bold">Blends</h2>

				<div className="flex items-end space-x-2 text-2xl">
					<Link href="blends/add-blend"><Button>Add Blend</Button></Link>
					<Link href="blends/add-formula"><Button>Add Formula</Button></Link>
				</div>
			</div>
			<div className="p-4">
				<Tabs defaultValue='viewAll'>
					<TabsList>
						<TabsTrigger value="viewAll">View All</TabsTrigger>
						<TabsTrigger value="currentlyActive">Currently Active</TabsTrigger>
					</TabsList>
					<TabsContent value="viewAll">
						<DataTable columns={columns} data={blends} usePagination={true} />
					</TabsContent>
					<TabsContent value="currentlyActive">
						<DataTable columns={columns} data={getCurrentlyActive(blends)} />
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
};

BlendsPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default BlendsPage;