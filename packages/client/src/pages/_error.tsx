import { Button } from "components/Button";
import type { NextPageContext } from "next";
import NextErrorComponent, { ErrorProps } from "next/error";
import * as Sentry from "@sentry/react";

interface ErrorPageProps extends ErrorProps {
  hasGetInitialPropsRun: boolean;
}

function ErrorPage({ statusCode }: ErrorPageProps) {
  function handleReload() {
    window.location.reload();
  }

  return (
    <main className="px-4 h-screen grid place-items-center  dark:text-white">
      <div className="flex flex-col justify-center max-w-2xl mt-5">
        <p>
          {!statusCode &&
            "Application error: a client-side exception has occurred (see the browser console for more information)."}
        </p>

        <Button className="mt-5 max-w-fit" onClick={handleReload}>
          Reload page
        </Button>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = async (context: NextPageContext) => {
  const errorInitialProps = (await NextErrorComponent.getInitialProps(context)) as ErrorPageProps;
  const { err, res, asPath } = context;

  errorInitialProps.hasGetInitialPropsRun = true;

  if (res?.statusCode === 404) {
    return errorInitialProps;
  }

  if (err) {
    Sentry.captureException(err);

    await Sentry.flush(2000);

    return errorInitialProps;
  }

  Sentry.captureException(new Error(`_error.js getInitialProps missing data at path: ${asPath}`));
  await Sentry.flush(2000);

  return errorInitialProps;
};

export default ErrorPage;
