import React, { type PropsWithChildren } from 'react';
import { useSession } from 'next-auth/react';
import MainNav from '@/components/MainNav';
import UserNav from '@/components/UserNav';
import { Toaster } from '@/components/ui/toaster';

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
	const { data: sessionData } = useSession();

	return (
		<div className="relative flex min-h-screen max-w-6xl mx-auto flex-col">
			<div className="border-b">
				<div className="flex h-16 items-center">
					<MainNav />
					<div className="ml-auto px-2 flex items-center space-x-4">
						<UserNav user={sessionData?.user} />
					</div>
				</div>
			</div>

			<main className="flex-1 space-y-4 mt-6 mb-4 border rounded-md">
				{children}
			</main>
			<Toaster />
		</div>
	);
};

export default Layout;