import styles from './index.module.css';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import ProfileIcon from '../Icons/ProfileIcon';
import ChevronDownIcon from '../Icons/ChevronDownIcon';
import { Session } from 'next-auth';
import LoginButton from '../LoginButton';

export default function ({ sessionData }: { sessionData: Session | null; }) {
	const [menuOpen, setMenuOpen] = useState(false);

	function toggleMenu() {
		setMenuOpen((prev) => !prev);
	}

	return <div className={styles['user-menu']} data-logged-in={Boolean(sessionData?.user)} data-menu-open={menuOpen}>
		{sessionData?.user
			? <>
				<button className={styles['user-menu__button']} onClick={() => void toggleMenu()}>
					<div className={styles['user-menu__profile-pic']}>
						{
							sessionData.user?.image
								? <img className={styles['profile-pic__image']} src={sessionData.user.image} />
								: <ProfileIcon className={styles['profile-pic__placeholder']} />
						}
					</div>
					<span className={styles['user-menu__user-name']}>{sessionData.user?.name ?? 'User'}</span>

					<ChevronDownIcon className={styles['user-menu__icon']} />

				</button>
				<ul className={styles['user-menu__options']}>
					<li><button className={styles['user-menu__option']} onClick={() => void signOut()}>Sign Out</button></li>
				</ul>
			</>
			: <LoginButton />
		}
	</div>;
}