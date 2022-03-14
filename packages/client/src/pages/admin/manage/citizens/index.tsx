import { useTranslations } from "use-intl";
import * as React from "react";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type { Citizen, User } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { AllCitizensTab } from "components/admin/manage/citizens/AllCitizensTab";

interface Props {
  citizens: (Citizen & { user: User })[];
}

export default function ManageCitizens({ citizens: data }: Props) {
  const [citizens, setCitizens] = React.useState<(Citizen & { user: User | null })[]>(data);
  const t = useTranslations("Management");

  React.useEffect(() => {
    setCitizens(data);
  }, [data]);

  return (
    <AdminLayout>
      <Title>{t("MANAGE_CITIZENS")}</Title>

      <h1 className="text-3xl font-semibold mb-3">{t("MANAGE_CITIZENS")}</h1>

      <AllCitizensTab setCitizens={setCitizens} citizens={citizens} />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [citizens, values] = await requestAll(req, [
    ["/admin/manage/citizens", []],
    ["/admin/values/gender?paths=ethnicity", []],
  ]);

  return {
    props: {
      citizens,
      values,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
