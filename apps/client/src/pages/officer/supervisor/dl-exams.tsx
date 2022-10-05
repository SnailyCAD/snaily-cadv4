import type { GetServerSideProps } from "next";

export default function Page() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/officer/supervisor/exams",
      permanent: true,
    },
  };
};
