import styles from "./index.module.css";
import { type NextPage } from "next";
import Head from "next/head";
import Link from 'next/link';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Production Manager</title>
        <meta name="description" content="Manage your factory's production demands with this state-of-the-art web app." />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <main className={styles.main}>
        <section className={styles.container}>
          <h2 className={styles.header}>Products</h2>
          <Link href="/product">Product List</Link>
          <Link href="/product/add">Add Product</Link>
        </section>
      </main>
    </>
  );
};

export default Home;