import Head from 'next/head';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import FactoryCreator from './components/FactoryCreator';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import { api } from '@/utils/api';
import type { NextPageWithLayout } from '../_app';
import superjson from '@/utils/superjson';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerAuthSession(context);

	return authenticatedSSProps(context, false)
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

const OnboardPage: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const router = useRouter();

	const factoryQuery = api.factory.getById.useQuery(
		{ id: user.factoryId! },
		{
			enabled: user.factoryId !== undefined,
			refetchOnWindowFocus: false
		}
	);

	const { data: factory } = factoryQuery;


	function onFactoryChange() {
		void router.push('/dashboard');
	}


	return (
		<>
			<Head>
				<title>Production Manager | Onboard</title>
				<meta name="description" content="User onboarding for Production Manager." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<div className="p-2">
				<h2 className="text-3xl font-bold">Production Manager Onboarding</h2>
				{factory
					? <p className="my-4">You have already completed the onboarding process.</p>
					: <FactoryCreator
						userId={user.id}
						onFactoryCreated={onFactoryChange}
					/>
				}
			</div>
		</>
	);
};

OnboardPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default OnboardPage;

