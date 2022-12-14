import { useTranslations } from "use-intl";
import * as React from "react";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { AllCitizensTab } from "components/admin/manage/citizens/all-citizens-tab";
import { Permissions } from "@snailycad/permissions";
import type { GetManageCitizensData } from "@snailycad/types/api";

interface Props {
  citizens: GetManageCitizensData;
}

export default function ManageCitizens({ citizens: data }: Props) {
  const [citizens, setCitizens] = React.useState(data.citizens);
  const t = useTranslations("Management");

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

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [citizens] = await requestAll(req, [
    ["/admin/manage/citizens", { citizens: [], totalCount: 0 }],
  ]);

  return {
    props: {
      citizens,
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
