import type { AppProps } from "next/app";
import { AuthProvider } from "src/context/AuthContext";
import "styles/globals.scss";
import { NextIntlProvider } from "next-intl";
import { ModalProvider } from "src/hooks/useModal";
import { ValuesProvider } from "src/context/ValuesContext";

export default function App({ Component, router, pageProps }: AppProps) {
  return (
    <AuthProvider initialData={pageProps}>
      <NextIntlProvider locale={router.locale ?? "en"} messages={pageProps.messages}>
        <ModalProvider>
          <ValuesProvider initialData={pageProps}>
            <Component {...pageProps} />
          </ValuesProvider>
        </ModalProvider>
      </NextIntlProvider>
    </AuthProvider>
  );
}
