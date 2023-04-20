import styles from './index.module.css';
import ProfileIcon from '../Icons/ProfileIcon';
import ChevronDownIcon from '../Icons/ChevronDownIcon';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import type { User } from 'next-auth';

const UserMenu: React.FC<{ user?: User; }> = ({ user }) => {
	const [menuOpen, setMenuOpen] = useState(false);

	function toggleMenu() {
		setMenuOpen((prev) => !prev);
	}

	return user ? (
		<div className={styles['user-menu']} data-logged-in={Boolean(user)} data-menu-open={menuOpen}>
			<button className={styles['user-menu__button']} onClick={() => void toggleMenu()}>
				<div className={styles['user-menu__profile-pic']}>
					{
						user?.image
							? <img className={styles['profile-pic__image']} alt="Profile Pic" src={user.image} />
							: <ProfileIcon className={styles['profile-pic__placeholder']} />
					}
				</div>
				<span className={styles['user-menu__user-name']}>{user.name}</span>

				<ChevronDownIcon className={styles['user-menu__icon']} />

			</button>
			<ul className={styles['user-menu__options']}>
				<li><button className={styles['user-menu__option']} onClick={() => void signOut({ redirect: true })}>Sign Out</button></li>
			</ul>
		</div>
	) : null;
};

export default UserMenu;