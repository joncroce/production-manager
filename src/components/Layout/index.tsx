import styles from './index.module.css';
import NavBar from '../NavBar';
import FactoryMenu from '../FactoryMenu';
import UserMenu from '../UserMenu';
import React, { type PropsWithChildren } from 'react';
import { useSession } from 'next-auth/react';

const Layout: React.FC<PropsWithChildren> = ({ children }) => {

	const { data: sessionData } = useSession();

	return (
		<>
			<div className={styles['menubar']}>
				<FactoryMenu factoryId={sessionData?.user.factoryId} />
				<UserMenu user={sessionData?.user} />
			</div>
			<div className={styles['main-container']}>
				<NavBar />
				<main className={styles['main']}>
					{children}
				</main>
			</div>
		</>
	);
};

export default Layout;