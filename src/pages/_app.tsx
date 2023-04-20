import { SessionProvider } from "next-auth/react";
import type { ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';
import type { AppType, AppProps } from "next/app";
import type { Session } from "next-auth";

import { api } from "../utils/api";

import "../styles/globals.css";

// eslint-disable-next-line @typescript-eslint/ban-types
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp: AppType<{ session: Session | null; }> = ({
  Component,
  pageProps: { session, ...pageProps }
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page);
  const layout = getLayout(<Component {...pageProps} />);

  return (
    <SessionProvider session={session as Session | null}>
      {layout}
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
