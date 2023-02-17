import styles from './create.module.css';
import type { NextPage } from 'next';
import Head from 'next/head';
import MapEditor from '@/components/MapEditor';


const CreateMapPage: NextPage = () => {
	return (
		<>
			<Head>
				<title>Create New Map</title>
			</Head>
			<main className={styles.main}>
				<header className={styles.main_header}>Create New Map</header>
				<MapEditor />
			</main>
		</>
	);
};

export default CreateMapPage;