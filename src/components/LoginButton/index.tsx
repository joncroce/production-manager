import { signIn } from 'next-auth/react';
import styles from './index.module.css';

export default function () {
	return <button className={styles['login-button']} onClick={() => void signIn()}>Sign In</button>;
}