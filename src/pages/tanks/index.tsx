import { createServerSideHelpers } from '@trpc/react-query/server';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import { api } from '@/utils/api';
import superjson from '@/utils/superjson';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { DataTable } from './components/table/data-table';
import { columns } from './components/table/columns';
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

			await helpers.tank.getAll.prefetch({ factoryId: props.user?.factoryId ?? '' });

			return {
				props: {
					...props,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		});
};

const TanksPage: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const tanksQuery = api.tank.getAll.useQuery(
		{ factoryId: user?.factoryId ?? '' },
		{
			enabled: user.factoryId !== undefined,
			refetchOnWindowFocus: false,
		}
	);

	const { data: tanks } = tanksQuery;

	if (!tanks) {
		throw new Error('Error retrieving tanks data.');
	}

	return (
		<>
			<div className="flex justify-between border-b p-2">
				<h2 className="text-3xl font-bold">Tanks</h2>

				<div className="flex items-end space-x-2 text-2xl">
					<Link href="tanks/add-tank"><Button>Add Tank</Button></Link>
				</div>
			</div>
			<div className="p-4">
				<DataTable columns={columns} data={tanks} />
			</div>
		</>
	);
};

TanksPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default TanksPage;