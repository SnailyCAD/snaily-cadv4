import { useTranslations } from "use-intl";
import * as React from "react";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Citizen, Rank, User } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { AllCitizensTab } from "components/admin/manage/citizens/AllCitizensTab";
import { Permissions } from "@snailycad/permissions";

interface Props {
  citizens: { citizens: (Citizen & { user: User })[]; totalCount: number };
}

export default function ManageCitizens({ citizens: data }: Props) {
  const [citizens, setCitizens] = React.useState<(Citizen & { user: User | null })[]>(
    data.citizens,
  );
  const t = useTranslations("Management");

  React.useEffect(() => {
    setCitizens(data.citizens);
  }, [data]);

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [
          Permissions.ViewCitizens,
          Permissions.DeleteCitizens,
          Permissions.ManageCitizens,
        ],
      }}
    >
      <Title>{t("MANAGE_CITIZENS")}</Title>

      <AllCitizensTab totalCount={data.totalCount} setCitizens={setCitizens} citizens={citizens} />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [citizens, values] = await requestAll(req, [
    ["/admin/manage/citizens", { citizens: [], totalCount: 0 }],
    ["/admin/values/gender?paths=ethnicity", []],
  ]);

  return {
    props: {
      citizens,
      values,
      session: user,
      messages: {
        ...(await getTranslations(
          ["citizen", "admin", "values", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
