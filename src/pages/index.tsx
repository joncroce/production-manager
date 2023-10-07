import Head from "next/head";
import { getSession } from 'next-auth/react';
import LoginButton from '@/components/LoginButton';
import type { GetServerSideProps, NextPage } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });
  let redirect;

  if (session) {
    redirect = { destination: '/dashboard', permanent: false };
  }

  return {
    props: {},
    redirect
  };
};

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Production Manager</title>
        <meta name="description" content="Manage your factory's production demands with this state-of-the-art web app." />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <main className="min-h-screen grid place-items-center">
        <article className="text-center">
          <h2 className="my-6 text-3xl font-bold">Welcome</h2>
          <p>This is a demo of <strong>Production Manager</strong>, an app created to assist with managing a lubricants production facility.</p>
          <p>To get started, sign in with one of the authentication providers below.</p>
          <section className="my-8">
            <LoginButton />
          </section>
        </article>
      </main>
    </>
  );
};

export default HomePage;