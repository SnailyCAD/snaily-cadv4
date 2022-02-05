import { Button } from "components/Button";

function ErrorPage({ statusCode }: any) {
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

ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;

  return { statusCode };
};

export default ErrorPage;
