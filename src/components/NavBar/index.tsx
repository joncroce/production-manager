import styles from './index.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { SVGProps } from 'react';

const NavBar: React.FC = () => {
	const router = useRouter();

	return (
		<nav className={styles['nav']}>
			<pre>{router.pathname}</pre>
			<Link className={styles['nav__link']} href="/dashboard" data-current-route={router.pathname.startsWith('/dashboard')}>
				<MingcuteLayoutGridFill className={styles['nav__icon']} />
				Dashboard
			</Link>
			<Link className={styles['nav__link']} href="/blending" data-current-route={router.pathname.startsWith('/blending')}>
				<MingcuteScienceFill className={styles['nav__icon']} />
				Blending
			</Link>
			<Link className={styles['nav__link']} href="/product" data-current-route={router.pathname.startsWith('/product')}>
				<MingcuteListOrderedFill className={styles['nav__icon']} />
				Products
			</Link>
		</nav>
	);
};

export default NavBar;

export function MingcuteLayoutGridFill(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" fillOpacity="0.5" d="M3 5a2 2 0 0 1 2-2h6v8H3V5Zm8 8H3v6a2 2 0 0 0 2 2h6v-8Zm2 8h6a2 2 0 0 0 2-2v-6h-8v8Zm0-10V3h6a2 2 0 0 1 2 2v6h-8Z">
			</path>
		</svg>
	);
}

export function MingcuteScienceFill(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" fillOpacity="0.5" d="M4.222 4.222c1.353-1.353 3.39-1.467 5.433-.822A12.26 12.26 0 0 1 12 4.444c.803-.456 1.59-.805 2.345-1.044c2.044-.646 4.08-.531 5.433.822c1.353 1.353 1.468 3.39.822 5.433A12.26 12.26 0 0 1 19.556 12c.456.803.805 1.59 1.044 2.345c.646 2.043.531 4.08-.822 5.433c-1.352 1.353-3.39 1.468-5.433.822A12.258 12.258 0 0 1 12 19.556c-.803.456-1.59.805-2.345 1.044c-2.043.645-4.08.53-5.433-.822c-1.353-1.353-1.467-3.39-.822-5.433c.239-.756.588-1.542 1.044-2.345A12.258 12.258 0 0 1 3.4 9.655c-.645-2.043-.53-4.08.822-5.433Zm1.489 9.687a9.108 9.108 0 0 0-.404 1.039c-.536 1.697-.27 2.816.33 3.416c.599.6 1.718.865 3.415.329c.333-.105.68-.24 1.04-.404a22.771 22.771 0 0 1-2.334-2.046a22.782 22.782 0 0 1-2.047-2.334Zm12.579 0a22.78 22.78 0 0 1-2.047 2.334a22.772 22.772 0 0 1-2.334 2.047c.359.163.706.298 1.039.403c1.698.536 2.816.27 3.416-.329c.6-.6.866-1.718.33-3.416a9.1 9.1 0 0 0-.404-1.04ZM12 10.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3Zm2.948-5.193a9.11 9.11 0 0 0-1.04.404a22.7 22.7 0 0 1 2.335 2.046a22.787 22.787 0 0 1 2.047 2.334c.164-.359.298-.706.403-1.039c.537-1.698.271-2.816-.329-3.416c-.6-.6-1.718-.865-3.416-.329Zm-9.312.33c-.6.599-.865 1.717-.329 3.415c.105.333.24.68.404 1.04c.59-.78 1.273-1.561 2.047-2.335a22.777 22.777 0 0 1 2.333-2.046a9.11 9.11 0 0 0-1.039-.404c-1.697-.536-2.816-.27-3.416.33Z">
			</path>
		</svg>
	);
}

export function MingcuteListOrderedFill(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" fillOpacity="0.5" d="M5.436 16.72a1.466 1.466 0 0 1 1.22 2.275a1.466 1.466 0 0 1-1.22 2.275c-.587 0-1.134-.21-1.38-.79c-.153-.361-.112-.79.297-.963a.65.65 0 0 1 .852.344a.177.177 0 0 0 .165.11c.114-.003.23-.026.23-.168c0-.1-.073-.143-.156-.155l-.051-.003a.65.65 0 0 1-.112-1.29l.112-.01c.102 0 .207-.037.207-.158c0-.141-.116-.165-.23-.168a.177.177 0 0 0-.164.11a.65.65 0 0 1-.853.345c-.409-.174-.45-.603-.297-.963c.246-.58.793-.79 1.38-.79ZM20 17.5a1.5 1.5 0 0 1 0 3H9a1.5 1.5 0 0 1 0-3h11ZM6.08 9.945a1.552 1.552 0 0 1 .43 2.442l-.554.593h.47a.65.65 0 1 1 0 1.3H4.573a.655.655 0 0 1-.655-.654c0-.207.029-.399.177-.557L5.559 11.5c.142-.152.03-.473-.203-.415c-.087.022-.123.089-.134.165l-.004.059a.65.65 0 1 1-1.3 0c0-.692.439-1.314 1.123-1.485c.35-.088.718-.04 1.04.121ZM20 10.5a1.5 1.5 0 0 1 .144 2.993L20 13.5H9a1.5 1.5 0 0 1-.144-2.993L9 10.5h11ZM6.15 3.39v3.24a.65.65 0 0 1-1.3 0V4.523a.65.65 0 0 1-.46-1.184l.742-.494a.655.655 0 0 1 1.018.544ZM20 3.5a1.5 1.5 0 0 1 .144 2.993L20 6.5H9a1.5 1.5 0 0 1-.144-2.993L9 3.5h11Z">
			</path>
		</svg>
	);
}