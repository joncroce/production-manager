import styles from './index.module.css';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { authenticatedSSProps } from '@/server/auth';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const Dashboard: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {

	return (
		<>
			<Head>
				<title>Production Manager</title>
				<meta name="description" content="Manage your factory's production demands with this state-of-the-art web app." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<section className={styles.container}>
				<h2>Dashboard</h2>
			</section>
		</>
	);
};

Dashboard.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default Dashboard;