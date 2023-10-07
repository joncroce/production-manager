import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import type { GetServerSideProps, NextPage } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getSession({ req: context.req });
	let redirect;

	if (session) {
		redirect = { destination: '/dashboard', permanent: false };
	}

	return {
		props: {},
		redirect
	};
};

const LoginPage: NextPage = () => {
	return (
		<>
			<Head>
				<title>Production Manager | Login</title>
				<meta name="description" content="User login for Production Manager." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main className="grid place-items-center">
				<Button onClick={() => void signIn('discord')}>
					Sign In
				</Button>
			</main>
		</>
	);
};

export default LoginPage;