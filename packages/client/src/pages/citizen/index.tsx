import { handleRequest } from "lib/fetch";
import type { GetServerSideProps } from "next";

interface Props {
  citizens: any[];
}

export default function Citizen({}: Props) {
  return <div>Hello world</div>;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const { data } = await handleRequest<any[]>("/citizen", {
    headers: req.headers,
  });

  return {
    props: {
      citizens: data ?? [],
    },
  };
};
