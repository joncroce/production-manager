import styles from './index.module.css';
import Link from 'next/link';
import Layout from '@/components/Layout';
import type { NextPageWithLayout } from '../_app';

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

export default BlendingHome;

BlendingHome.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};