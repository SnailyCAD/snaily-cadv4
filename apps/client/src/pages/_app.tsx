import type { AppProps } from "next/app";
import { SSRProvider } from "@react-aria/ssr";
import { NextIntlProvider } from "next-intl";
import { AuthProvider } from "context/AuthContext";
import { ValuesProvider } from "context/ValuesContext";
import { CitizenProvider } from "context/CitizenContext";
import "styles/globals.scss";
import "styles/fonts.scss";
import { SocketProvider } from "@casper124578/use-socket.io";
import { getAPIUrl } from "lib/fetch/getAPIUrl";
import { setTag, setTags } from "@sentry/nextjs";
import type { cad, User } from "@snailycad/types";
import { useMounted } from "@casper124578/useful/hooks/useMounted";
import dynamic from "next/dynamic";
import Head from "next/head";

const ReauthorizeSessionModal = dynamic(
  async () =>
    (await import("components/auth/login/ReauthorizeSessionModal")).ReauthorizeSessionModal,
  { ssr: false },
);

const Toaster = dynamic(async () => (await import("react-hot-toast")).Toaster, { ssr: false });

export default function App({ Component, router, pageProps, ...rest }: AppProps) {
  const isMounted = useMounted();
  const { protocol, host } = new URL(getAPIUrl());
  const url = `${protocol}//${host}`;
  const user = pageProps.session as User | null;
  const locale = user?.locale ?? router.locale ?? "en";
  trySetUserTimezone();

  const cad = pageProps?.cad as cad | null;
  if (cad?.version) {
    setTags({
      "snailycad.locale": locale,
      "snailycad.version": cad.version.currentVersion,
      "snailycad.commitHash": cad.version.currentCommitHash,
    });
  }

  return (
    <SSRProvider>
      <SocketProvider uri={url} options={{ reconnectionDelay: 10_000 }}>
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
          </NextIntlProvider>
        </AuthProvider>
      </SocketProvider>
    </SSRProvider>
  );
}

function trySetUserTimezone() {
  try {
    if (typeof window !== "undefined") {
      setTag("snailycad.timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  } catch {
    // ignore
  }
}
