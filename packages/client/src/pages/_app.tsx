import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import { NextIntlProvider } from "next-intl";
import { AuthProvider } from "context/AuthContext";
import { ModalProvider } from "context/ModalContext";
import { ValuesProvider } from "context/ValuesContext";
import { CitizenProvider } from "context/CitizenContext";
import "styles/globals.scss";
import { SocketProvider } from "context/SocketContext";

const styles: React.CSSProperties = {
  minWidth: "20em",
  fontSize: "1.1rem",
  padding: "0.5em 1em",
  fontWeight: 600,
};

export default function App({ Component, router, pageProps }: AppProps) {
  return (
    <AuthProvider initialData={pageProps}>
      <NextIntlProvider locale={router.locale ?? "en"} messages={pageProps.messages}>
        <ModalProvider>
          <ValuesProvider initialData={pageProps}>
            <CitizenProvider initialData={pageProps}>
              <SocketProvider url="http://localhost:8080" options={{}}>
                <Component {...pageProps} />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: styles,
                  }}
                />
              </SocketProvider>
            </CitizenProvider>
          </ValuesProvider>
        </ModalProvider>
      </NextIntlProvider>
    </AuthProvider>
  );
}
