import styles from './index.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { SVGProps } from 'react';

const NavBar: React.FC = () => {
	const router = useRouter();

	return (
		<nav className={styles['nav']}>
			<Link className={styles['nav__link']} href="/dashboard" data-current-route={router.pathname.startsWith('/dashboard')}>
				<MingcuteLayoutGridFill className={styles['nav__icon']} />
				<span className={styles['nav__link-text']}>
					Dashboard
				</span>
			</Link>
			<Link className={styles['nav__link']} href="/blending" data-current-route={router.pathname.startsWith('/blending')}>
				<MingcuteScienceFill className={styles['nav__icon']} />
				<span className={styles['nav__link-text']}>
					Blending
				</span>
			</Link>
			{router.pathname.startsWith('/blending')
				? <div className={styles['nav__subtree']}>
					<Link className={styles['nav__sublink']} href="/blending/list-blends" data-current-route={router.pathname.startsWith('/blending/list-blends')}>
						<MaterialSymbolsViewList className={styles['nav__icon']} />
						<span className={styles['nav__link-text']}>
							List Blends
						</span>
					</Link>
					<Link className={styles['nav__sublink']} href="/blending/add-blend" data-current-route={router.pathname.startsWith('/blending/add-blend')}>
						<MingcuteAddCircleLine className={styles['nav__icon']} />
						<span className={styles['nav__link-text']}>
							Add Blend
						</span>
					</Link>
					<Link className={styles['nav__sublink']} href="/blending/add-formula" data-current-route={router.pathname.startsWith('/blending/add-formula')}>
						<UilFlaskPotion className={styles['nav__icon']} />
						<span className={styles['nav__link-text']}>
							Add Formula
						</span>
					</Link>
				</div>
				: null
			}
			<Link className={styles['nav__link']} href="/product" data-current-route={router.pathname.startsWith('/product')}>
				<MingcuteListOrderedFill className={styles['nav__icon']} />
				<span className={styles['nav__link-text']}>
					Products
				</span>
			</Link>
			<Link className={styles['nav__link']} href="/settings" data-current-route={router.pathname.startsWith('/settings')}>
				<MingcuteSettings5Line className={styles['nav__icon']} />
				<span className={styles['nav__link-text']}>
					Settings
				</span>
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

export function MaterialSymbolsViewList(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" fillOpacity="0.5" d="M9 20h11q.825 0 1.413-.588T22 18v-2H9v4ZM2 8h5V4H4q-.825 0-1.413.588T2 6v2Zm0 6h5v-4H2v4Zm2 6h3v-4H2v2q0 .825.588 1.413T4 20Zm5-6h13v-4H9v4Zm0-6h13V6q0-.825-.588-1.413T20 4H9v4Z">
			</path>
		</svg>
	);
}


export function MingcuteAddCircleLine(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" fillOpacity="0.5" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2Zm0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16Zm0 3a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H8a1 1 0 1 1 0-2h3V8a1 1 0 0 1 1-1Z">
			</path>
		</svg>
	);
}


export function MingcuteSettings5Line(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" fillOpacity="0.5" d="M14.41 2.293a9.946 9.946 0 0 1 2.75 1.14a1 1 0 0 1 .47 1.019c-.113.689.059 1.216.38 1.538c.322.322.85.493 1.538.38a1 1 0 0 1 1.02.47a9.948 9.948 0 0 1 1.14 2.75a1 1 0 0 1-.388 1.054c-.568.407-.82.9-.82 1.356c0 .456.252.95.82 1.357a1 1 0 0 1 .388 1.053a9.947 9.947 0 0 1-1.14 2.75a1 1 0 0 1-1.02.47c-.689-.113-1.215.059-1.537.38c-.322.322-.494.85-.38 1.538a1 1 0 0 1-.47 1.02a9.948 9.948 0 0 1-2.752 1.14a1 1 0 0 1-1.053-.388c-.406-.568-.9-.82-1.356-.82c-.455 0-.95.252-1.356.82a1 1 0 0 1-1.053.388a9.948 9.948 0 0 1-2.752-1.14a1 1 0 0 1-.47-1.02c.114-.688-.057-1.215-.38-1.537c-.321-.322-.848-.494-1.537-.38a1 1 0 0 1-1.019-.47a9.947 9.947 0 0 1-1.14-2.752a1 1 0 0 1 .388-1.053c.567-.406.82-.9.82-1.356c0-.455-.253-.95-.82-1.356a1 1 0 0 1-.388-1.053a9.946 9.946 0 0 1 1.14-2.751a1 1 0 0 1 1.019-.47c.689.113 1.216-.058 1.538-.38c.322-.322.493-.85.38-1.538a1 1 0 0 1 .47-1.019a9.947 9.947 0 0 1 2.75-1.14a1 1 0 0 1 1.054.388c.407.567.9.82 1.356.82c.456 0 .95-.253 1.357-.82a1 1 0 0 1 1.053-.388Zm.102 2.11C13.855 5.06 12.992 5.5 12 5.5s-1.855-.439-2.512-1.098a7.944 7.944 0 0 0-1.084.45c.001.93-.299 1.85-1 2.552c-.701.701-1.622 1.001-2.552 1c-.176.348-.326.71-.45 1.084c.659.657 1.098 1.52 1.098 2.512s-.439 1.855-1.098 2.512c.124.374.275.737.45 1.085c.93-.002 1.85.298 2.552 1c.701.7 1.001 1.621 1 2.551c.347.176.71.326 1.084.45c.657-.659 1.52-1.098 2.512-1.098s1.855.44 2.512 1.098a7.943 7.943 0 0 0 1.085-.45c-.002-.93.298-1.85 1-2.552c.7-.701 1.621-1 2.551-1c.176-.347.326-.71.45-1.084c-.659-.657-1.098-1.52-1.098-2.512s.44-1.855 1.098-2.512a7.94 7.94 0 0 0-.45-1.084c-.93.001-1.85-.299-2.552-1c-.701-.701-1-1.622-1-2.552a7.945 7.945 0 0 0-1.084-.45ZM12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4a2 2 0 0 0 0-4Z">
			</path>
		</svg>
	);
}

export function UilFlaskPotion(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" fillOpacity="0.5" d="M18.93 11.67a.42.42 0 0 0 0-.1A7.4 7.4 0 0 0 15 7.62V4h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v3.62a7.4 7.4 0 0 0-3.89 4a.42.42 0 0 0 0 .1a7.5 7.5 0 1 0 13.86 0Zm-8.62-2.41a1 1 0 0 0 .69-.95V4h2v4.31a1 1 0 0 0 .69.95A5.43 5.43 0 0 1 16.23 11H7.77a5.43 5.43 0 0 1 2.54-1.74ZM12 20a5.51 5.51 0 0 1-5.5-5.5a5.34 5.34 0 0 1 .22-1.5h10.56a5.34 5.34 0 0 1 .22 1.5A5.51 5.51 0 0 1 12 20Zm2-4a1 1 0 1 0 1 1a1 1 0 0 0-1-1Zm-4-1a1 1 0 1 0 1 1a1 1 0 0 0-1-1Z">
			</path>
		</svg>
	);
}

export function MingcuteDropFill(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" fillOpacity="0.5" d="M11.249 2.321a1.18 1.18 0 0 1 1.502 0A28.635 28.635 0 0 1 16.682 6.3C18.322 8.339 20 11.106 20 14a8 8 0 0 1-16 0c0-2.894 1.678-5.661 3.318-7.701a28.636 28.636 0 0 1 3.93-3.978Z">
			</path>
		</svg>
	);
}