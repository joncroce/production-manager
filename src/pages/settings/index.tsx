import Head from 'next/head';
import Layout from '@/components/Layout';
import type { GetServerSideProps } from 'next';
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';
import { api } from '@/utils/api';
import FactoryDeleter from './components/FactoryDeleter';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import { useRouter } from 'next/navigation';
import superjson from '@/utils/superjson';

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

			if (props.user.factoryId) {
				await helpers.factory.getById.prefetch({ id: props.user.factoryId });
			}

			return {
				props: {
					...props,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		});
};

const SettingsPage: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const router = useRouter();

	const factoryQuery = api.factory.getById.useQuery(
		{ id: user.factoryId! },
		{
			enabled: user.factoryId !== undefined,
			refetchOnWindowFocus: false
		}
	);

	const { data: factory } = factoryQuery;

	if (!factory) {
		throw new Error('Error loading factory data.');
	}

	function onFactoryDeleted() {
		void router.push('/onboard');
	}

	return (
		<>
			<Head>
				<title>Production Manager | Onboard</title>
				<meta name="description" content="User onboarding for Production Manager." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<div className="p-2">
				<h2 className="my-6 text-3xl font-bold">Settings</h2>
				<FactoryDeleter
					{...factory}
					onFactoryDeleted={onFactoryDeleted}
				/>
			</div>
		</>
	);
};

SettingsPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default SettingsPage;