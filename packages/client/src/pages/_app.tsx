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

export default function App({ Component, router, pageProps }: AppProps) {
  const { hostname, protocol, port } = new URL(findAPIUrl());
  const url = `${protocol}//${hostname}:${port}`;

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
                  <Component {...pageProps} />
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
