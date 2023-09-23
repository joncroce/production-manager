import Link from 'next/link';
import { cn } from '@/lib/utils';
import React from 'react';

export default function MainNav({
	className, ...props
}: React.HTMLAttributes<HTMLElement>) {
	return (
		<nav className={cn("flex items-center space-x-4 text-xl font-medium", className)} {...props}>
			<Link href="/dashboard" className="transition-colors hover:text-primary">
				Dashboard
			</Link>
			<Link href="/blends" className="transition-colors hover:text-primary">
				Blends
			</Link>
			<Link href="/products" className="transition-colors hover:text-primary">
				Products
			</Link>
			<Link href="/tanks" className="transition-colors hover:text-primary">
				Tanks
			</Link>
			<Link href="/settings" className="transition-colors hover:text-primary">
				Settings
			</Link>
		</nav>
	);
}