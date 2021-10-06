import type { GetServerSideProps } from "next";
import type { Citizen } from "types/prisma";
import Link from "next/link";
import { Layout } from "components/Layout";
import { handleRequest } from "lib/fetch";
import { getSessionUser } from "lib/auth";
import Head from "next/head";

interface Props {
  citizens: Citizen[];
}

export default function CitizenPage({ citizens }: Props) {
  return (
    <Layout>
      <Head>
        <title>Citizens - SnailyCAD</title>
      </Head>

      <h1 className="text-3xl font-semibold mb-3">Citizens</h1>

      <ul className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-3">
        <Link href="/citizen/create">
          <a className="py-1.5 px-3 text-white bg-gray-500 hover:bg-gray-600 rounded-md transition-all">
            Create Citizen
          </a>
        </Link>
        <button className="text-left py-1.5 px-3 text-white bg-gray-500 hover:bg-gray-600 rounded-md transition-all">
          Register Vehicle
        </button>
        <button className="text-left py-1.5 px-3 text-white bg-gray-500 hover:bg-gray-600 rounded-md transition-all">
          Register Weapon
        </button>
      </ul>

      <ul className="flex flex-col space-y-3">
        {citizens.length <= 0 ? (
          <p className="text-gray-600 font-medium">{"You don't have any citizens."}</p>
        ) : (
          citizens.map((citizen) => (
            <li
              key={citizen.id}
              className="p-3  bg-gray-200 rounded-md flex justify-between items-center"
            >
              <div className="flex items-center space-x-3">
                <img
                  draggable={false}
                  className="rounded-full w-14"
                  src="https://yt3.ggpht.com/yJ9oovZC3P9YSil0Wjk7UgnYnLORTSwP_wFjAvqJ_m-z08zpTwll2rnWqYsXUVGb-Dlh_fqeaw=s88-c-k-c0x00ffffff-no-nd-rj"
                />

                <p className="text-xl font-semibold">{citizen.fullName}</p>
              </div>

              <div>
                <Link href={`/citizen/${citizen.id}`}>
                  <a className="py-1.5 px-3 text-white bg-gray-500 hover:bg-gray-600 rounded-md transition-all">
                    View Citizen
                  </a>
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const { data } = await handleRequest<any[]>("/citizen", {
    headers: req.headers,
  }).catch(() => ({ data: null }));

  return {
    props: {
      citizens: data ?? [],
      session: await getSessionUser(req.headers),
    },
  };
};
