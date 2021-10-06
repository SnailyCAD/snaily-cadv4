import type { AppProps } from "next/app";
import { AuthProvider } from "src/context/AuthContext";
import "styles/globals.scss";
import { NextIntlProvider } from "next-intl";

export default function App({ Component, router, pageProps }: AppProps) {
  return (
    <AuthProvider initialData={pageProps}>
      <NextIntlProvider locale={router.locale ?? "en"} messages={pageProps.messages}>
        <Component {...pageProps} />
      </NextIntlProvider>
    </AuthProvider>
  );
}
