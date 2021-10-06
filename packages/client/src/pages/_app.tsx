import type { AppProps } from "next/app";
import { AuthProvider } from "src/context/AuthContext";
import "styles/globals.scss";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider initialData={pageProps}>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
