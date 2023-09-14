import styles from './index.module.css';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authenticatedSSProps } from '@/server/auth';
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from '../_app';

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const BlendingHome: NextPageWithLayout = () => {
	return (
		<main>
			<article className={styles['blending']}>
				<h1 className={styles['blending__header']}>Blending</h1>
			</article>
		</main>
	);
};

BlendingHome.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default BlendingHome;