import type { User } from "@snailycad/types";
import { classNames } from "lib/classNames";
import Document, { Html, Head, Main, NextScript, DocumentContext } from "next/document";

class CustomDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    const session = this.props.__NEXT_DATA__.props.pageProps?.session as User | null;
    const userSavedLocale = this.props.__NEXT_DATA__.props.pageProps?.userSavedLocale as
      | string
      | null;
    const userSavedIsDarkTheme = this.props.__NEXT_DATA__.props.pageProps?.userSavedIsDarkTheme as
      | boolean
      | null;

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
