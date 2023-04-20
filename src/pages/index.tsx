import styles from "./index.module.css";
import Head from "next/head";
import LoginButton from '@/components/LoginButton';
import { getSession } from 'next-auth/react';
import type { SVGProps } from 'react';
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

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Production Manager</title>
        <meta name="description" content="Manage your factory's production demands with this state-of-the-art web app." />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <main className={styles['main']}>
        <article className={styles['welcome']}>
          <h2 className={styles['welcome__header']}>Welcome</h2>
          <p>This is a demo of <strong>Production Manager</strong>, an app created to assist with managing a lubricants production facility.</p>
          <p>To get started, sign in with one of the authentication providers below.</p>
          <section className={styles['welcome__login']}>
            <LoginButton provider='discord'>
              <span className={styles['login-button__inner']}>Sign in via Discord <MingcuteDiscordLine className={styles['login-button__icon']} /></span>
            </LoginButton>
          </section>
        </article>
      </main>
    </>
  );
};

export default Home;

export function MingcuteDiscordLine(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="#888888" d="M15.003 4c.259 0 .584.068.845.132c.91.22 1.989.493 2.755 1.068c.713.535 1.267 1.468 1.695 2.416c.89 1.975 1.509 4.608 1.723 6.61c.102.95.127 1.906-.056 2.549c-.09.316-.285.554-.422.7c-.418.443-.956.774-1.488 1.075l-.264.149a25.21 25.21 0 0 1-.525.284l-.522.27l-.717.357l-.577.284a1 1 0 0 1-1.166-1.59l-.434-.868A13.057 13.057 0 0 1 12 18c-1.37 0-2.677-.2-3.85-.564l-.433.866a1 1 0 0 1-1.164 1.592l-.544-.27c-.604-.298-1.208-.596-1.796-.925c-.614-.343-1.265-.708-1.752-1.225a1.737 1.737 0 0 1-.422-.7c-.184-.642-.158-1.597-.057-2.548c.214-2.002.833-4.635 1.724-6.61c.427-.948.981-1.881 1.694-2.416c.766-.575 1.845-.848 2.755-1.068C8.416 4.068 8.74 4 9 4a1 1 0 0 1 .99 1.147A13.65 13.65 0 0 1 12 5c.691 0 1.366.05 2.014.148A1 1 0 0 1 15.004 4Zm1.354 2.363c-.15-.048-.186-.027-.24.063l-.062.112a1.515 1.515 0 0 1-1.635.716A11.405 11.405 0 0 0 12 7c-.852 0-1.667.09-2.42.254a1.515 1.515 0 0 1-1.635-.716l-.062-.111c-.053-.09-.089-.111-.238-.064c-.356.113-.738.234-1.045.437c-.287.215-.67.75-1.071 1.639c-.766 1.697-1.366 4.204-1.558 6c-.04.379-.061.704-.066.972v.294c.004.178.017.319.035.421c.254.249.568.444.883.623l.682.377l.446.235l.364-.728a1 1 0 0 1 1.133-1.624C8.664 15.62 10.246 16 12 16c1.753 0 3.336-.382 4.552-.99a1 1 0 0 1 1.213 1.538l-.08.085l.364.73c.298-.154.597-.317.897-.483c.39-.216.8-.443 1.117-.753c.018-.103.03-.244.035-.422v-.294a11.403 11.403 0 0 0-.066-.973c-.192-1.795-.792-4.302-1.558-6c-.4-.888-.784-1.423-1.07-1.638c-.308-.203-.69-.324-1.047-.437ZM8.75 10.5a1.75 1.75 0 1 1 0 3.5a1.75 1.75 0 0 1 0-3.5Zm6.5 0a1.75 1.75 0 1 1 0 3.5a1.75 1.75 0 0 1 0-3.5Z">
      </path>
    </svg>
  );
}