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
		<>
			<h1 className={styles['page-title']}>Blending</h1>
			<nav className={styles['nav']} aria-label="Blending Menu">
				<Link className={styles['nav__item']} href="/blending/add-blend">Add Blend</Link>
				<Link className={styles['nav__item']} href="/blending/view-blends">View Status of Blends</Link>
				<Link className={styles['nav__item']} href="/blending/add-formula">Add Formula</Link>
			</nav>
		</>
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