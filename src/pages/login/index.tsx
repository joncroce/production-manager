import Head from 'next/head';
import { getSession } from 'next-auth/react';
import LoginButton from '@/components/LoginButton';
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
			<main className="min-h-screen grid place-items-center text-3xl">
				<LoginButton />
			</main>
		</>
	);
};

export default LoginPage;