import type { AppProps } from "next/app";
import { AuthProvider } from "src/context/AuthContext";
import "styles/globals.scss";
import { NextIntlProvider } from "next-intl";
import { ModalProvider } from "context/ModalContext";
import { ValuesProvider } from "src/context/ValuesContext";
import { CitizenProvider } from "context/CitizenContext";

export default function App({ Component, router, pageProps }: AppProps) {
  return (
    <AuthProvider initialData={pageProps}>
      <NextIntlProvider locale={router.locale ?? "en"} messages={pageProps.messages}>
        <ModalProvider>
          <ValuesProvider initialData={pageProps}>
            <CitizenProvider initialData={pageProps}>
              <Component {...pageProps} />
            </CitizenProvider>
          </ValuesProvider>
        </ModalProvider>
      </NextIntlProvider>
    </AuthProvider>
  );
}
