import styles from './index.module.css';
import NavBar from '../NavBar';
import UserMenu from '../UserMenu';
import type { ReactElement } from 'react';
import { useSession } from 'next-auth/react';
import LoginButton from '../LoginButton';

export default function Layout({ children }: { children: ReactElement; }) {

	const { data: sessionData } = useSession();

	return (
		<>
			<div className={styles['menubar']}>
				<UserMenu sessionData={sessionData} />
			</div>
			{
				sessionData?.user
					? <div className={styles['main-container']}>
						<NavBar />
						<main className={styles['main']}>
							{children}
						</main>
					</div>
					: <main className={styles['main--not-logged-in']}>
						<div className={styles['welcome']}>
							<p className={styles['welcome__message']}>Welcome to <strong>Production Manager</strong></p>
							<LoginButton />
						</div>
					</main>
			}
		</>
	);
}