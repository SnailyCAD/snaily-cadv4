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
import { Input } from "components/form/Input";
import { FormField } from "components/form/FormField";

interface Props {
  users: User[];
}

export default function ManageCitizens({ users: data }: Props) {
  const [users, setUsers] = React.useState<User[]>(data);
  const [search, setSearch] = React.useState("");

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

      <h1 className="mb-4 text-3xl font-semibold">{t("MANAGE_USERS")}</h1>

      <FormField label={common("search")} className="my-2">
        <Input
          placeholder="john doe"
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          className=""
        />
      </FormField>

      <TabsContainer tabs={tabs}>
        <Tab.Panel>
          <ul className="mt-5">
            {users.filter(handleFilter.bind(null, search)).map((user, idx) => (
              <li
                className="flex flex-col w-full px-4 py-3 my-1 bg-gray-200 rounded-md dark:bg-gray-2"
                key={user.id}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 select-none">{idx + 1}.</span>
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

        <PendingUsersTab
          setUsers={setUsers}
          users={pending.filter(handleFilter.bind(null, search))}
        />
      </TabsContainer>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [users] = await requestAll(req, [["/admin/manage/users", []]]);

  return {
    props: {
      users,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};

function handleFilter(search: string, user: User) {
  if (!search) {
    return true;
  }

  const { username } = user;

  return username.toLowerCase().includes(search.toLowerCase());
}
