import { signIn } from 'next-auth/react';
import styles from './index.module.css';
import type { BuiltInProviderType } from 'next-auth/providers';
import type { PropsWithChildren } from 'react';

const LoginButton: React.FC<{ provider?: BuiltInProviderType; } & PropsWithChildren> = ({ provider = 'discord', children }) => {
	return (
		<button className={styles['login-button']} onClick={() => void signIn(provider)}>
			{children ?? "Sign In"}
		</button>
	);
};

export default LoginButton;