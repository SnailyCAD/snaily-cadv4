import type { AppProps } from "next/app";
import "cropperjs/dist/cropper.css";
import { SSRProvider } from "@react-aria/ssr";
import { Toaster } from "react-hot-toast";
import { NextIntlProvider } from "next-intl";
import { AuthProvider } from "context/AuthContext";
import { ModalProvider } from "context/ModalContext";
import { ValuesProvider } from "context/ValuesContext";
import { CitizenProvider } from "context/CitizenContext";
import "styles/globals.scss";
import { SocketProvider } from "@casper124578/use-socket.io";
import { findUrl } from "lib/fetch";

const styles: React.CSSProperties = {
  minWidth: "20em",
  fontSize: "1.1rem",
  padding: "0.5em 1em",
  fontWeight: 600,
};

export default function App({ Component, router, pageProps }: AppProps) {
  const { hostname, protocol, port } = new URL(findUrl());
  const url = `${protocol}//${hostname}:${port}`;

  return (
    <SSRProvider>
      <SocketProvider
        uri={url}
        options={{
          reconnectionDelay: 5_000,
          reconnectionAttempts: 50,
        }}
      >
        <AuthProvider initialData={pageProps}>
          <NextIntlProvider
            onError={console.warn}
            locale={router.locale ?? "en"}
            messages={pageProps.messages}
          >
            <ModalProvider>
              <ValuesProvider initialData={pageProps}>
                <CitizenProvider initialData={pageProps}>
                  <Component {...pageProps} />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      style: styles,
                    }}
                  />
                </CitizenProvider>
              </ValuesProvider>
            </ModalProvider>
          </NextIntlProvider>
        </AuthProvider>
      </SocketProvider>
    </SSRProvider>
  );
}
