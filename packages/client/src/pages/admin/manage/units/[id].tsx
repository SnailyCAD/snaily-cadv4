import * as React from "react";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { FullDeputy, FullOfficer } from "state/dispatchState";
import { useTranslations } from "use-intl";

type Unit = FullOfficer | FullDeputy;

interface Props {
  unit: Unit | null;
}

export default function SupervisorPanelPage({ unit }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");

  unit;
  common;
  t;

  console.log({ unit });

  if (!unit) {
    return null;
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold">{unit.name}</h1>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, req, locale }) => {
  const [unit] = await requestAll(req, [[`/admin/manage/units/${query.id}`, null]]);

  if (!unit) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      unit,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["admin", "leo", "ems-fd", "values", "common"], locale)),
      },
    },
  };
};
