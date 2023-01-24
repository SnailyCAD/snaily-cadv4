import * as React from "react";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll, yesOrNoText } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { useModal } from "state/modalState";
import { Button } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import type { IncidentInvolvedUnit, LeoIncident } from "@snailycad/types";
import { useLeoState } from "state/leo-state";
import dynamic from "next/dynamic";
import { useImageUrl } from "hooks/useImageUrl";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import { usePermission, Permissions } from "hooks/usePermission";
import { isUnitCombined } from "@snailycad/utils";
import type {
  DeleteIncidentByIdData,
  GetActiveOfficerData,
  GetDispatchData,
  GetIncidentsData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import Image from "next/image";

interface Props extends GetDispatchData {
  incidents: GetIncidentsData;
  activeOfficer: GetActiveOfficerData | null;
}

const ManageIncidentModal = dynamic(async () => {
  return (await import("components/leo/incidents/manage-incident-modal")).ManageIncidentModal;
});

const AlertModal = dynamic(async () => {
  return (await import("components/modal/AlertModal")).AlertModal;
});

export default function LeoIncidents({ activeOfficer, incidents: initialData }: Props) {
  const asyncTable = useAsyncTable({
    initialData: initialData.incidents,
    totalCount: initialData.totalCount,
    fetchOptions: {
      onResponse: (json: GetIncidentsData) => ({
        data: json.incidents,
        totalCount: json.totalCount,
      }),
      path: "/incidents",
    },
  });

  const [tempIncident, incidentState] = useTemporaryItem(asyncTable.items);
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const setActiveOfficer = useLeoState((state) => state.setActiveOfficer);
  const { generateCallsign } = useGenerateCallsign();
  const { makeImageUrl } = useImageUrl();
  const { user } = useAuth();
  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();

  const isOfficerOnDuty = activeOfficer && activeOfficer.status?.shouldDo !== "SET_OFF_DUTY";

  function onDeleteClick(incident: LeoIncident) {
    openModal(ModalIds.AlertDeleteIncident);
    incidentState.setTempId(incident.id);
  }

  function onEditClick(incident: LeoIncident) {
    openModal(ModalIds.ManageIncident);
    incidentState.setTempId(incident.id);
  }

  function makeAssignedUnit(unit: IncidentInvolvedUnit) {
    if (!unit.unit) return "UNKNOWN";

    return isUnitCombined(unit.unit)
      ? generateCallsign(unit.unit, "pairedUnitTemplate")
      : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;
  }

  async function handleDelete() {
    if (!tempIncident) return;

    const { json } = await execute<DeleteIncidentByIdData>({
      path: `/incidents/${tempIncident.id}`,
      method: "DELETE",
    });

    if (json) {
      closeModal(ModalIds.AlertDeleteIncident);
      incidentState.setTempId(null);

      asyncTable.remove(tempIncident.id);
    }
  }

  React.useEffect(() => {
    setActiveOfficer(activeOfficer);
  }, [setActiveOfficer, activeOfficer]);

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
            title={!isOfficerOnDuty ? "You must have an active officer." : ""}
            disabled={!isOfficerOnDuty}
            onPress={() => openModal(ModalIds.ManageIncident)}
          >
            {t("createIncident")}
          </Button>
        ) : null}
      </header>

      {asyncTable.items.length <= 0 ? (
        <p className="mt-5">{t("noIncidents")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((incident) => {
            const nameAndCallsign = incident.creator
              ? `${generateCallsign(incident.creator)} ${makeUnitName(incident.creator)}`
              : "";

            return {
              id: incident.id,
              caseNumber: `#${incident.caseNumber}`,
              officer: (
                <span // * 9 to fix overlapping issues with next table column
                  style={{ minWidth: nameAndCallsign.length * 9 }}
                  className="flex items-center"
                >
                  {incident.creator?.imageId ? (
                    <Image
                      className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                      draggable={false}
                      src={makeImageUrl("units", incident.creator.imageId)!}
                      loading="lazy"
                      width={30}
                      height={30}
                      alt={`${incident.creator.citizen.name} ${incident.creator.citizen.surname}`}
                    />
                  ) : null}
                  {incident.creator ? nameAndCallsign : t("dispatch")}
                </span>
              ),
              unitsInvolved:
                incident.unitsInvolved.map(makeAssignedUnit).join(", ") || common("none"),
              firearmsInvolved: common(yesOrNoText(incident.firearmsInvolved)),
              injuriesOrFatalities: common(yesOrNoText(incident.injuriesOrFatalities)),
              arrestsMade: common(yesOrNoText(incident.arrestsMade)),
              situationCode: incident.situationCode?.value.value ?? common("none"),
              description: <CallDescription data={incident} />,
              createdAt: <FullDate>{incident.createdAt}</FullDate>,
              actions: (
                <>
                  {hasPermissions([Permissions.ManageIncidents], true) ? (
                    <Button
                      size="xs"
                      variant="success"
                      className="mr-2"
                      onPress={() => onEditClick(incident)}
                      disabled={!isOfficerOnDuty}
                    >
                      {common("edit")}
                    </Button>
                  ) : null}

                  {hasPermissions([Permissions.ManageIncidents], user?.isSupervisor ?? false) ? (
                    <Button size="xs" variant="danger" onPress={() => onDeleteClick(incident)}>
                      {common("delete")}
                    </Button>
                  ) : null}
                </>
              ),
            };
          })}
          columns={[
            { header: t("caseNumber"), accessorKey: "caseNumber" },
            { header: t("officer"), accessorKey: "officer" },
            { header: t("unitsInvolved"), accessorKey: "unitsInvolved" },
            { header: t("firearmsInvolved"), accessorKey: "firearmsInvolved" },
            { header: t("injuriesOrFatalities"), accessorKey: "injuriesOrFatalities" },
            { header: t("arrestsMade"), accessorKey: "arrestsMade" },
            { header: t("situationCode"), accessorKey: "situationCode" },
            { header: common("description"), accessorKey: "description" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      {isOfficerOnDuty && hasPermissions([Permissions.ManageIncidents], true) ? (
        <ManageIncidentModal
          onCreate={(incident) => {
            asyncTable.append(incident);
          }}
          onUpdate={(oldIncident, incident) => {
            asyncTable.update(oldIncident.id, { ...oldIncident, ...incident });
          }}
          onClose={() => incidentState.setTempId(null)}
          incident={tempIncident}
        />
      ) : null}

      {hasPermissions([Permissions.ManageIncidents], user?.isSupervisor ?? false) ? (
        <AlertModal
          id={ModalIds.AlertDeleteIncident}
          title={t("deleteIncident")}
          description={t("alert_deleteIncident")}
          onDeleteClick={handleDelete}
          onClose={() => incidentState.setTempId(null)}
          state={state}
        />
      ) : null}
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
