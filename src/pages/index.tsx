import Layout from '@/components/Layout';
import styles from "./index.module.css";
import { type NextPage } from "next";
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from "next/head";
import Link from 'next/link';
import { NextPageWithLayout } from './_app';
import { ReactElement } from 'react';

const Home: NextPageWithLayout = () => {

  const { data: sessionData } = useSession();
  return (
    <>
      <Head>
        <title>Production Manager</title>
        <meta name="description" content="Manage your factory's production demands with this state-of-the-art web app." />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <section className={styles.container}>

      </section>
    </>
  );
};

export default Home;

Home.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};