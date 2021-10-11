import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import Head from "next/head";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import type { User } from "types/prisma";
import { AdminLayout } from "components/admin/AdminLayout";

interface Props {
  users: User[];
}

export default function ManageCitizens({ users: data }: Props) {
  const [users, setUsers] = React.useState<User[]>(data);

  const t = useTranslations("Management");
  const common = useTranslations("Common");

  React.useEffect(() => {
    setUsers(data);
  }, [data]);

  return (
    <AdminLayout>
      <Head>
        <title>{t("MANAGE_USERS")}</title>
      </Head>

      <h1 className="text-3xl font-semibold">{t("MANAGE_USERS")}</h1>

      <ul className="mt-5">
        {users.map((user, idx) => (
          <li className="my-1 bg-gray-200 py-3 px-4 rounded-md w-full flex flex-col" key={user.id}>
            <div className="flex items-center justify-between">
              <div>
                <span className="select-none text-gray-500">{idx + 1}.</span>
                <span className="ml-2">{user.username}</span>
              </div>

              <div>
                <Link href={`/admin/manage/users/${user.id}`}>
                  <a className="transition-colors text-white bg-gray-500 hover:bg-gray-600 p-1.5 px-3 rounded-md">
                    {common("manage")}
                  </a>
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const { data } = await handleRequest("/admin/manage/users", {
    headers: req.headers,
  }).catch(() => ({
    data: [],
  }));

  return {
    props: {
      users: data,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["citizen", "admin", "common"], locale)),
      },
    },
  };
};
