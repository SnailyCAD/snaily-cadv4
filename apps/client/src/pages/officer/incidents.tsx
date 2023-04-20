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
import { useLeoState } from "state/leo-state";
import { Title } from "components/shared/Title";
import { usePermission, Permissions } from "hooks/usePermission";
import type { GetActiveOfficerData, GetDispatchData, GetIncidentsData } from "@snailycad/types/api";
import { IncidentsTable } from "components/leo/incidents/incidents-table";
import { ExclamationCircleFill } from "react-bootstrap-icons";
import Link from "next/link";

interface Props extends GetDispatchData {
  incidents: GetIncidentsData<"leo">;
  activeOfficer: GetActiveOfficerData | null;
}

export default function LeoIncidents({ activeOfficer, incidents: initialData }: Props) {
  const t = useTranslations("Leo");
  const { openModal } = useModal();
  const setActiveOfficer = useLeoState((state) => state.setActiveOfficer);
  const { hasPermissions } = usePermission();

  const isOfficerOnDuty =
    (activeOfficer && activeOfficer.status?.shouldDo !== "SET_OFF_DUTY") ?? false;

  React.useEffect(() => {
    setActiveOfficer(activeOfficer);
  }, [setActiveOfficer, activeOfficer]);

  return (
    <Layout
      permissions={{
        permissions: [Permissions.ViewIncidents, Permissions.ManageIncidents],
      }}
      className="dark:text-white"
    >
      {!isOfficerOnDuty ? (
        <div
          role="alert"
          className="mb-5 flex flex-col p-2 px-4 text-black rounded-md shadow bg-orange-400 border border-orange-500/80"
        >
          <header className="flex items-center gap-2 mb-2">
            <ExclamationCircleFill />
            <h5 className="font-semibold text-lg">Inactive Officer</h5>
          </header>
          <p>
            You must have an on-duty officer before you can manage incident. Please go to the{" "}
            <Link className="font-medium underline" href="/officer">
              Officer Dashboard
            </Link>{" "}
            and set your officer to on-duty.
          </p>
        </div>
      ) : null}

      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("incidents")}</Title>

        {hasPermissions([Permissions.ManageIncidents]) ? (
          <Button
            title={!isOfficerOnDuty ? "You must have an active officer." : ""}
            disabled={!isOfficerOnDuty}
            onPress={() => openModal(ModalIds.ManageIncident)}
          >
            {t("createIncident")}
          </Button>
        ) : null}
      </header>

      <IncidentsTable initialData={initialData} isUnitOnDuty={isOfficerOnDuty} type="leo" />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [incidents, activeOfficer, values] = await requestAll(req, [
    ["/incidents", { incidents: [], totalCount: 0 }],
    ["/leo/active-officer", null],
    ["/admin/values/codes_10", []],
  ]);

  return {
    props: {
      session: user,
      incidents,
      activeOfficer,
      values,
      messages: {
        ...(await getTranslations(["leo", "calls", "common"], user?.locale ?? locale)),
      },
    },
  };
};
