import type { NextPage } from 'next';
import Link from 'next/link';

const BlendingHome: NextPage = () => {

	return (
		<>
			<h1>Blending</h1>
			<nav aria-label="Blending Menu">
				<Link href="/blending/add-blend">Add Blend</Link>
				{/*<Link href="/blending/blend-status">View Status of Blends</Link> */}
				<Link href="/blending/add-formula">Add Formula</Link>
			</nav>
		</>
	);
};

export default BlendingHome;