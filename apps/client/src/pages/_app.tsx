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
import { ModalProvider } from "@react-aria/overlays";

import { setTags } from "@sentry/nextjs";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import type { cad, User } from "@snailycad/types";
import { useMounted } from "@casper124578/useful/hooks/useMounted";
import dynamic from "next/dynamic";

const ReauthorizeSessionModal = dynamic(
  async () =>
    (await import("components/auth/login/ReauthorizeSessionModal")).ReauthorizeSessionModal,
  {
    ssr: false,
  },
);

const Toaster = dynamic(async () => (await import("react-hot-toast")).Toaster, { ssr: false });

export default function App({ Component, router, pageProps }: AppProps<any>) {
  const isMounted = useMounted();
  const { protocol, host } = new URL(getAPIUrl());
  const url = `${protocol}//${host}`;
  const user = pageProps.session as User | null;
  const locale = user?.locale ?? router.locale ?? "en";

  const cad = pageProps?.cad as cad | null;
  if (cad?.version) {
    setTags({
      "snailycad.version": cad.version.currentVersion,
      "snailycad.commitHash": cad.version.currentCommitHash,
    });
  }

  return (
    <SSRProvider>
      <ModalProvider>
        <SocketProvider uri={url} options={{ reconnectionDelay: 10_000 }}>
          <AuthProvider initialData={pageProps}>
            <NextIntlProvider onError={console.warn} locale={locale} messages={pageProps.messages}>
              <ValuesProvider initialData={pageProps}>
                <CitizenProvider initialData={pageProps}>
                  <GoogleReCaptchaProvider
                    reCaptchaKey={process.env.NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY as string}
                    scriptProps={{ async: true, defer: true, appendTo: "body" }}
                    useRecaptchaNet
                  >
                    {isMounted ? <ReauthorizeSessionModal /> : null}
                    <Component {...pageProps} />
                  </GoogleReCaptchaProvider>
                  <Toaster position="top-right" />
                </CitizenProvider>
              </ValuesProvider>
            </NextIntlProvider>
          </AuthProvider>
        </SocketProvider>
      </ModalProvider>
    </SSRProvider>
  );
}
