import styles from './index.module.css';
import Head from 'next/head';
import { getSession } from 'next-auth/react';
import type { GetServerSideProps, NextPage } from "next";
import type { Session } from 'next-auth';
import FactoryCreator from '@/components/FactoryCreator';
import Link from 'next/link';

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getSession({ req: context.req });
	let redirect;

	if (!session) {
		redirect = { destination: '/login', permanent: false };
	}

	return {
		props: {
			user: session?.user
		},
		redirect
	};
};

const Onboard: NextPage<{ user: Session['user']; }> = ({ user }) => {
	return (
		<>
			<Head>
				<title>Production Manager | Onboard</title>
				<meta name="description" content="User onboarding for Production Manager." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main className={styles['main']}>
				<article className={styles['onboard']}>
					<h2 className={styles['onboard__header']}>Getting Started</h2>
					{user.factoryId
						? <section>
							<p>You have already finished the onboarding process.</p>
							<p>Visit <Link href="/settings">the settings page</Link> if you wish to delete your current factory and start over.</p>
							<p><Link href="/dashboard">Go to Dashboard</Link></p>
						</section>
						: <FactoryCreator userId={user.id} />
					}
				</article>
			</main>
		</>
	);
};

export default Onboard;