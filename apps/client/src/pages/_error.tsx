import { Button } from "@snailycad/ui";
import type { NextPageContext } from "next";
import NextErrorComponent, { ErrorProps } from "next/error";
import * as Sentry from "@sentry/nextjs";

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

        <Button className="mt-5 max-w-fit" onPress={handleReload}>
          Reload page
        </Button>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = async (context: NextPageContext) => {
  await Sentry.captureUnderscoreErrorException(context);

  return NextErrorComponent.getInitialProps(context);
};

export default ErrorPage;
