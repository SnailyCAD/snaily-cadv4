import type { AppProps } from "next/app";
import "cropperjs/dist/cropper.css";
import { SSRProvider } from "@react-aria/ssr";
import { Toaster } from "react-hot-toast";
import { NextIntlProvider } from "next-intl";
import { AuthProvider } from "context/AuthContext";
import { ValuesProvider } from "context/ValuesContext";
import { CitizenProvider } from "context/CitizenContext";
import "styles/globals.scss";
import { SocketProvider } from "@casper124578/use-socket.io";
import { findAPIUrl } from "lib/fetch";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import type { cad } from "@snailycad/types";
import { useMounted } from "@casper124578/useful";
import dynamic from "next/dynamic";

const ReauthorizeSessionModal = dynamic(
  async () =>
    (await import("components/auth/login/ReauthorizeSessionModal")).ReauthorizeSessionModal,
  {
    ssr: false,
  },
);

Sentry.init({
  dsn: "https://6e31d0dc886d482091e293edb73eb10e@o518232.ingest.sentry.io/6553264",
  tracesSampleRate: 1.0,
  integrations: [new BrowserTracing()],
});

export default function App({ Component, router, pageProps }: AppProps) {
  const isMounted = useMounted();
  const { hostname, protocol, port } = new URL(findAPIUrl());
  const url = `${protocol}//${hostname}:${port}`;

  const cad = pageProps?.cad as cad | null;
  if (cad?.version) {
    Sentry.setTags({
      "snailycad.version": cad.version.currentVersion,
      "snailycad.commitHash": cad.version.currentCommitHash,
    });
  }

  return (
    <SSRProvider>
      <SocketProvider uri={url} options={{ reconnectionDelay: 10_000 }}>
        <AuthProvider initialData={pageProps}>
          <NextIntlProvider
            onError={console.warn}
            locale={router.locale ?? "en"}
            messages={pageProps.messages}
          >
            <ValuesProvider initialData={pageProps}>
              <CitizenProvider initialData={pageProps}>
                <DndProvider backend={HTML5Backend}>
                  <GoogleReCaptchaProvider
                    reCaptchaKey={process.env.NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY}
                    scriptProps={{ async: true, defer: true, appendTo: "body" }}
                    useRecaptchaNet
                  >
                    {isMounted ? <ReauthorizeSessionModal /> : null}
                    <Component {...pageProps} />
                  </GoogleReCaptchaProvider>
                </DndProvider>
                <Toaster position="top-right" />
              </CitizenProvider>
            </ValuesProvider>
          </NextIntlProvider>
        </AuthProvider>
      </SocketProvider>
    </SSRProvider>
  );
}
