import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

export default function LoginButton() {
	return (
		<Button size="lg" onClick={() => void signIn('discord')}>
			Sign In via Discord
		</Button>
	);
}