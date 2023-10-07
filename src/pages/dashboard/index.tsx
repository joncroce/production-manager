import Head from 'next/head';
import Layout from '@/components/Layout';
import { authenticatedSSProps } from '@/server/auth';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const DashboardPage: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {

	return (
		<>
			<Head>
				<title>Production Manager | Dashboard</title>
				<meta name="description" content="Manage your factory's production demands with this state-of-the-art web app." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<div className="flex justify-between border-b p-2">
				<h2 className="text-3xl font-bold">Dashboard</h2>
			</div>
		</>
	);
};

DashboardPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default DashboardPage;