import * as React from "react";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { useModal } from "state/modalState";
import { Button } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import { Title } from "components/shared/Title";
import { usePermission, Permissions } from "hooks/usePermission";
import type { GetDispatchData, GetEmsFdActiveDeputy, GetIncidentsData } from "@snailycad/types/api";

import { useEmsFdState } from "state/ems-fd-state";
import { IncidentsTable } from "components/leo/incidents/incidents-table";

interface Props extends GetDispatchData {
  incidents: GetIncidentsData<"ems-fd">;
  activeDeputy: GetEmsFdActiveDeputy | null;
}

export default function EmsFdIncidents({ activeDeputy, incidents: initialData }: Props) {
  const t = useTranslations("Leo");
  const { openModal } = useModal();
  const setActiveDeputy = useEmsFdState((state) => state.setActiveDeputy);

  const { hasPermissions } = usePermission();

  const isDeputyOnDuty =
    (activeDeputy && activeDeputy.status?.shouldDo !== "SET_OFF_DUTY") ?? false;

  React.useEffect(() => {
    setActiveDeputy(activeDeputy);
  }, [setActiveDeputy, activeDeputy]);

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewIncidents, Permissions.ManageIncidents],
      }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("incidents")}</Title>

        {hasPermissions([Permissions.ManageIncidents], true) ? (
          <Button
            title={!isDeputyOnDuty ? "You must have an active ems/fd deputy." : ""}
            disabled={!isDeputyOnDuty}
            onPress={() => openModal(ModalIds.ManageIncident)}
          >
            {t("createIncident")}
          </Button>
        ) : null}
      </header>

      <IncidentsTable initialData={initialData} isUnitOnDuty={isDeputyOnDuty} type="ems-fd" />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [incidents, activeDeputy, values] = await requestAll(req, [
    ["/ems-fd/incidents", { incidents: [], totalCount: 0 }],
    ["/ems-fd/active-deputy", null],
    ["/admin/values/codes_10", []],
  ]);

  return {
    props: {
      session: user,
      incidents,
      activeDeputy,
      values,
      messages: {
        ...(await getTranslations(["leo", "calls", "common"], user?.locale ?? locale)),
      },
    },
  };
};
