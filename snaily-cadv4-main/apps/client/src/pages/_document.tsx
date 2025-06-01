import type { User } from "@snailycad/types";
import { classNames } from "lib/classNames";
import Document, { Html, Head, Main, NextScript } from "next/document";

class CustomDocument extends Document {
  render() {
    const session = this.props.__NEXT_DATA__.props.pageProps?.session as User | null;
    const userSavedLocale = this.props.__NEXT_DATA__.props.pageProps?.userSavedLocale as
      | string
      | null;
    const userSavedIsDarkTheme = parseIsDarkTheme(
      this.props.__NEXT_DATA__.props.pageProps?.userSavedIsDarkTheme,
    );

    const darkMode = session?.isDarkTheme ?? userSavedIsDarkTheme ?? true;
    const lang = session?.locale || userSavedLocale || "en";

    return (
      <Html lang={lang}>
        <Head>
          <meta charSet="UTF-8" />
          <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        </Head>

        <body className={classNames("antialiased", darkMode && "dark")}>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default CustomDocument;

function parseIsDarkTheme(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}
