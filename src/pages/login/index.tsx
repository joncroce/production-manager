import styles from './index.module.css';
import LoginButton from '@/components/LoginButton';
import { getSession } from 'next-auth/react';
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

const Login: NextPage = () => {
	return (
		<main className={styles['login']}>
			<LoginButton />
		</main>
	);
};

export default Login;