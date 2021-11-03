import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import Head from "next/head";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import type { User } from "types/prisma";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { TabsContainer } from "components/tabs/TabsContainer";
import { Tab } from "@headlessui/react";
import { PendingUsersTab } from "components/admin/manage/PendingUsersTab";
import { Button } from "components/Button";

interface Props {
  users: User[];
}

export default function ManageCitizens({ users: data }: Props) {
  const [users, setUsers] = React.useState<User[]>(data);

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const pending = users.filter((v) => v.whitelistStatus === "PENDING");

  React.useEffect(() => {
    setUsers(data);
  }, [data]);

  const tabs = [`${t("allUsers")} (${users.length})`, `${t("pendingUsers")} (${pending.length})`];

  return (
    <AdminLayout className="dark:text-white">
      <Head>
        <title>{t("MANAGE_USERS")}</title>
      </Head>

      <h1 className="text-3xl font-semibold mb-4">{t("MANAGE_USERS")}</h1>

      <TabsContainer tabs={tabs}>
        <Tab.Panel>
          <ul className="mt-5">
            {users.map((user, idx) => (
              <li
                className="my-1 bg-gray-200 dark:bg-gray-2 py-3 px-4 rounded-md w-full flex flex-col"
                key={user.id}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="select-none text-gray-500">{idx + 1}.</span>
                    <span className="ml-2">{user.username}</span>
                  </div>

                  <div>
                    <Link href={`/admin/manage/users/${user.id}`}>
                      <a>
                        <Button>{common("manage")}</Button>
                      </a>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Tab.Panel>

        <PendingUsersTab setUsers={setUsers} users={pending} />
      </TabsContainer>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [users] = await requestAll(req, [["/admin/manage/users", []]]);

  return {
    props: {
      users,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
