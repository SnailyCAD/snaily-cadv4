import "styles/globals.css";
import "styles/fonts.css";
import "styles/nprogress.css";

import * as React from "react";
import type { AppProps } from "next/app";
import { NextIntlClientProvider } from "next-intl";
import { AuthProvider } from "context/AuthContext";
import { ValuesProvider } from "context/ValuesContext";
import { CitizenProvider } from "context/CitizenContext";
import { SocketProvider } from "@casperiv/use-socket.io";
import { getAPIUrl } from "@snailycad/utils/api-url";
import type { User } from "@snailycad/types";
import { useMounted } from "@casperiv/useful/hooks/useMounted";
import dynamic from "next/dynamic";
import Head from "next/head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { GetErrorMapOptions } from "lib/validation/zod-error-map";
import type { SetSentryTagsOptions } from "lib/set-sentry-tags";

const ReauthorizeSessionModal = dynamic(
  async () =>
    (await import("components/auth/login/reauthorize-session-modal")).ReauthorizeSessionModal,
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
  const cad = pageProps.cad ?? pageProps.session?.cad ?? null;
  const timeZone = cad?.timeZone || "UTC";

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

  const requiresDnd = DRAG_AND_DROP_PAGES.includes(router.pathname);
  const DndProviderWrapper = requiresDnd ? DndProvider : React.Fragment;

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider uri={url}>
        <AuthProvider initialData={pageProps}>
          <NextIntlClientProvider
            defaultTranslationValues={{
              span: (children) => <span className="font-semibold">{children}</span>,
            }}
            timeZone={timeZone}
            onError={console.warn}
            locale={locale}
            messages={pageProps.messages}
            now={new Date()}
            getMessageFallback={(key) => key.key}
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
          </NextIntlClientProvider>
        </AuthProvider>
      </SocketProvider>
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
