import { Loader } from "components/Loader";
import { findAPIUrl } from "lib/fetch";
import type { GetServerSideProps } from "next";

export default function ApiDocs() {
  return (
    <div className="fixed inset-0 grid bg-transparent place-items-center">
      <span aria-label="redirecting...">
        <Loader className="w-14 h-14 border-[3px]" />
      </span>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const apiURL = findAPIUrl();
  const destination = apiURL.replace("/v1", "/api-docs");

  return {
    redirect: {
      destination,
      permanent: true,
    },
  };
};
