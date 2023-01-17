import type { User } from "@snailycad/types";
import { classNames } from "lib/classNames";
import Document, { Html, Head, Main, NextScript, DocumentContext } from "next/document";

class CustomDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    let darkMode = true;
    let lang = "en";

    const session = this.props.__NEXT_DATA__.props.pageProps?.session as User | null;

    if (session) {
      darkMode = session.isDarkTheme;
      lang = session.locale || "en";
    }

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
