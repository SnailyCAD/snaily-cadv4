import * as React from "react";
import type { AppProps } from "next/app";
import { SSRProvider } from "@react-aria/ssr";
import { NextIntlProvider } from "next-intl";
import { AuthProvider } from "context/AuthContext";
import { ValuesProvider } from "context/ValuesContext";
import { CitizenProvider } from "context/CitizenContext";
import "styles/globals.scss";
import "styles/fonts.scss";
import "styles/nprogress.scss";
import { SocketProvider } from "@casper124578/use-socket.io";
import { getAPIUrl } from "@snailycad/utils/api-url";
import type { User } from "@snailycad/types";
import { useMounted } from "@casper124578/useful/hooks/useMounted";
import dynamic from "next/dynamic";
import Head from "next/head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { GetErrorMapOptions } from "lib/validation/zod-error-map";
import type { SetSentryTagsOptions } from "lib/set-sentry-tags";

const ReauthorizeSessionModal = dynamic(
  async () =>
    (await import("components/auth/login/ReauthorizeSessionModal")).ReauthorizeSessionModal,
  { ssr: false },
);

const DndProvider = dynamic(async () => (await import("@snailycad/ui")).DndProvider);
const Toaster = dynamic(async () => (await import("react-hot-toast")).Toaster, { ssr: false });

const DRAG_AND_DROP_PAGES = ["/dispatch", "/officer", "/ems-fd"];
const queryClient = new QueryClient();

export default function App({ Component, router, pageProps, ...rest }: AppProps) {
  const isMounted = useMounted();
  const { protocol, host } = new URL(getAPIUrl());
  const url = `${protocol}//${host}`;
  const user = pageProps.session as User | null;
  const locale = user?.locale ?? router.locale ?? "en";

  React.useEffect(() => {
    const handleRouteStart = async () => {
      const NProgress = await import("nprogress");
      NProgress.start();
    };
    const handleRouteDone = async () => {
      const NProgress = await import("nprogress");
      NProgress.done();
    };

    router.events.on("routeChangeStart", handleRouteStart);
    router.events.on("routeChangeComplete", handleRouteDone);
    router.events.on("routeChangeError", handleRouteDone);

    return () => {
      router.events.off("routeChangeStart", handleRouteStart);
      router.events.off("routeChangeComplete", handleRouteDone);
      router.events.off("routeChangeError", handleRouteDone);
    };
  }, [router.events]);

  React.useEffect(() => {
    // set error map for localized form error messages
    setErrorMap({ messages: pageProps.messages, locale });
  }, [locale, pageProps.messages]);

  React.useEffect(() => {
    _setSentryTags({
      cad: pageProps.cad,
      locale,
      isMounted,
    });
  }, [isMounted, pageProps.cad, locale]);

  const isServer = typeof window === "undefined";

  const requiresDnd = DRAG_AND_DROP_PAGES.includes(router.pathname);
  const DndProviderWrapper = requiresDnd ? DndProvider : React.Fragment;

  return (
    <QueryClientProvider client={queryClient}>
      <SSRProvider>
        <SocketProvider uri={url} options={{ reconnectionDelay: 10_000, autoConnect: !isServer }}>
          <AuthProvider initialData={pageProps}>
            <NextIntlProvider
              defaultTranslationValues={{
                span: (children) => <span className="font-semibold">{children}</span>,
              }}
              onError={console.warn}
              locale={locale}
              messages={pageProps.messages}
              now={new Date()}
            >
              <DndProviderWrapper>
                <ValuesProvider router={router} initialData={pageProps}>
                  <CitizenProvider initialData={pageProps}>
                    <Head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    </Head>
                    {isMounted ? (
                      <>
                        <ReauthorizeSessionModal />
                        <Toaster position="top-right" />
                      </>
                    ) : null}
                    <Component {...pageProps} err={(rest as any).err} />
                  </CitizenProvider>
                </ValuesProvider>
              </DndProviderWrapper>
            </NextIntlProvider>
          </AuthProvider>
        </SocketProvider>
      </SSRProvider>
    </QueryClientProvider>
  );
}

async function setErrorMap(options: GetErrorMapOptions) {
  const getErrorMap = await import("lib/validation/zod-error-map").then((mod) => mod.getErrorMap);
  const setZodErrorMap = await import("zod").then((mod) => mod.setErrorMap);

  setZodErrorMap(getErrorMap(options));
}

async function _setSentryTags(options: SetSentryTagsOptions) {
  (await import("lib/set-sentry-tags")).setSentryTags(options);
}
