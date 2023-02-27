import styles from "./index.module.css";
import { type NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Production Manager</title>
        <meta name="description" content="Manage your factory's production demands with this state-of-the-art web app." />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <main className={styles.main}>

      </main>
    </>
  );
};

export default Home;