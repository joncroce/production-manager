import styles from './index.module.css';
import React from 'react';
import Layout from '@/components/Layout';
import { authenticatedSSProps } from '@/server/auth';
import { api } from '@/utils/api';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';
import type { Blend as TBlend } from '@prisma/client';

export const getServerSideProps: GetServerSideProps = async (context) => {

	return authenticatedSSProps(context).then(({ props, redirect }) => {
		const id = context.params?.id;
		if (typeof context.params?.id !== 'string') {
			return { props, redirect: { destination: '/404', permanent: false } };
		} else {
			return {
				props: {
					...props,
					id
				},
				redirect
			};
		}
	});
};

const ViewBlend: NextPageWithLayout<{ user: Session['user']; id: string; }> = ({ id }) => {
	const blend = api.blend.get.useQuery({ id }, { enabled: typeof id === 'string' });

	return (
		<main>
			<article className={styles['view-blend']}>
				<h1 className={styles['view-blend__header']}>View Blend</h1>
				<BlendSheet blend={blend.data} />
			</article>
		</main>
	);
};

ViewBlend.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default ViewBlend;

const BlendSheet: React.FC<{
	blend?: TBlend;
}> = ({ blend }) => {
	return blend ? (
		<>
			<BlendTank factoryId={blend.factoryId} name={blend.blendTankName} />
		</>
	) : null;
};

const BlendTank: React.FC<{
	factoryId: string;
	name: string | null;
}> = ({ factoryId, name }) => {
	return (
		<section className={styles['blend-tank']}>
			<h2 className={styles['blend-tank__header']}>Blend Tank</h2>
			{name ? <p className={styles['blend-tank__name']}>{name}</p> : null}
			<BlendTankSelector factoryId={factoryId} />
			{/* <button className={styles['blend-tank__button']} type="button">{name ? 'Change' : 'Choose'}</button> */}
		</section>
	);
};

const BlendTankSelector: React.FC<{ factoryId: string; }> = ({ factoryId }) => {
	const tanks = api.tank.getBlendTanks.useQuery({ factoryId });

	return (
		<select>
			{tanks.data?.map((tank) => <option key={tank.name}>{tank.name}</option>)}
		</select>
	);
};