import { getSessionUser } from "lib/auth";
import type { GetServerSideProps } from "next";

export default function IndexPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const user = await getSessionUser(req);

  if (user) {
    return {
      redirect: {
        destination: "/citizen",
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: "/auth/login",
      permanent: false,
    },
  };
};
