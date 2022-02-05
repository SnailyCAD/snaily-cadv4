import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { User, WhitelistStatus } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll, yesOrNoText } from "lib/utils";
import { TabList, TabsContent } from "components/shared/TabList";
import { PendingUsersTab } from "components/admin/manage/users/PendingUsersTab";
import { Button } from "components/Button";
import { Input } from "components/form/inputs/Input";
import { FormField } from "components/form/FormField";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";

interface Props {
  users: User[];
}

export default function ManageUsers({ users: data }: Props) {
  const [users, setUsers] = React.useState<User[]>(data);
  const [search, setSearch] = React.useState("");

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const pending = users.filter((v) => v.whitelistStatus === WhitelistStatus.PENDING);

  React.useEffect(() => {
    setUsers(data);
  }, [data]);

  const tabs = [
    { name: `${t("allUsers")} (${users.length})`, value: "allUsers" },
    { name: `${t("pendingUsers")} (${pending.length})`, value: "pendingUsers" },
  ];

  return (
    <AdminLayout>
      <Title>{t("MANAGE_USERS")}</Title>

      <h1 className="mb-4 text-3xl font-semibold">{t("MANAGE_USERS")}</h1>

      <FormField label={common("search")} className="my-2">
        <Input placeholder="john doe" onChange={(e) => setSearch(e.target.value)} value={search} />
      </FormField>

      <TabList tabs={tabs}>
        <TabsContent aria-label={t("allUsers")} value="allUsers" className="mt-5">
          <Table
            filter={search}
            data={users.map((user) => ({
              username: user.username,
              rank: user.rank,
              isLeo: common(yesOrNoText(user.isLeo)),
              isSupervisor: common(yesOrNoText(user.isSupervisor)),
              isEmsFd: common(yesOrNoText(user.isEmsFd)),
              isDispatch: common(yesOrNoText(user.isDispatch)),
              actions: (
                <Link href={`/admin/manage/users/${user.id}`}>
                  <a>
                    <Button small>{common("manage")}</Button>
                  </a>
                </Link>
              ),
            }))}
            columns={[
              { Header: "Username", accessor: "username" },
              { Header: "Rank", accessor: "rank" },
              { Header: "LEO Access", accessor: "isLeo" },
              { Header: "LEO Supervisor", accessor: "isSupervisor" },
              { Header: "EMS/FD Access", accessor: "isEmsFd" },
              { Header: "Dispatch Access", accessor: "isDispatch" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        </TabsContent>

        <PendingUsersTab setUsers={setUsers} users={pending} search={search} />
      </TabList>
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
