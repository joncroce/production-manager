import styles from './index.module.css';
import Layout from '@/components/Layout';
import { authenticatedSSProps } from '@/server/auth';
import type { GetServerSideProps } from 'next';
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';
import { api } from '@/utils/api';
import { useRouter } from 'next/router';

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const Settings: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const router = useRouter();
	const deleteFactory = api.factory.delete.useMutation();

	const handleDeleteFactory = () => {
		if (user.factoryId) {
			deleteFactory.mutate({ id: user.factoryId }, {
				onSuccess() {
					alert('Factory Deleted.');
					void router.push('/onboard');
				}
			});
		}
	};

	return (
		<article className={styles['settings']}>
			<h2 className={styles['settings__header']}>
				Settings
			</h2>
			<section>
				<h3>Delete Factory</h3>
				<button
					className={styles['settings__button']}
					type="button"
					disabled={!user.factoryId}
					onClick={handleDeleteFactory}
				>
					Delete
				</button>
			</section>
		</article>
	);
};

Settings.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default Settings;