import type { GetStaticProps } from "next";

export default function Page() {
  return null;
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    redirect: {
      destination: "/officer/supervisor/exams",
      permanent: true,
    },
  };
};
