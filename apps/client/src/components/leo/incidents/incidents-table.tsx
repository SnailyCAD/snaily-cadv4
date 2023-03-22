import { Permissions } from "@snailycad/permissions";
import type { EmsFdIncident, IncidentInvolvedUnit, LeoIncident } from "@snailycad/types";
import type { DeleteIncidentByIdData } from "@snailycad/types/api";
import { Button } from "@snailycad/ui";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { FullDate } from "components/shared/FullDate";
import { ImageWrapper } from "components/shared/image-wrapper";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useAuth } from "context/AuthContext";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useImageUrl } from "hooks/useImageUrl";
import { usePermission } from "hooks/usePermission";
import useFetch from "lib/useFetch";
import { makeUnitName, yesOrNoText } from "lib/utils";
import dynamic from "next/dynamic";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

const ManageIncidentModal = dynamic(async () => {
  return (await import("components/leo/incidents/manage-incident-modal")).ManageIncidentModal;
});

const AlertModal = dynamic(async () => {
  return (await import("components/modal/AlertModal")).AlertModal;
});

interface IncidentsTableProps<T extends EmsFdIncident | LeoIncident> {
  type: T extends EmsFdIncident ? "ems-fd" : "leo";
  initialData: { incidents: T[]; totalCount: number };
  isUnitOnDuty?: boolean;
}

export function IncidentsTable<T extends EmsFdIncident | LeoIncident>(
  props: IncidentsTableProps<T>,
) {
  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  const asyncTable = useAsyncTable({
    initialData: props.initialData.incidents,
    totalCount: props.initialData.totalCount,
    fetchOptions: {
      onResponse: (json: IncidentsTableProps<T>["initialData"]) => ({
        data: json.incidents,
        totalCount: json.totalCount,
      }),
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      path: props.type === "ems-fd" ? "/ems-fd/incidents" : "/incidents",
    },
  });
  const [tempIncident, incidentState] = useTemporaryItem(asyncTable.items);

  const tableState = useTableState({ pagination: asyncTable.pagination });

  const { user } = useAuth();
  const { hasPermissions } = usePermission();
  const { openModal, closeModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { makeImageUrl } = useImageUrl();
  const { state, execute } = useFetch();

  async function handleDelete() {
    if (!tempIncident) return;

    const { json } = await execute<DeleteIncidentByIdData>({
      path:
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        props.type === "ems-fd"
          ? `/ems-fd/incidents/${tempIncident.id}`
          : `/incidents/${tempIncident.id}`,
      method: "DELETE",
    });

    if (json) {
      closeModal(ModalIds.AlertDeleteIncident);
      incidentState.setTempId(null);

      asyncTable.remove(tempIncident.id);
    }
  }

  function onDeleteClick(incident: T) {
    openModal(ModalIds.AlertDeleteIncident);
    incidentState.setTempId(incident.id);
  }

  function onEditClick(incident: T) {
    openModal(ModalIds.ManageIncident);
    incidentState.setTempId(incident.id);
  }

  function makeAssignedUnit(unit: IncidentInvolvedUnit) {
    if (!unit.unit) return "UNKNOWN";

    return isUnitCombined(unit.unit) || isUnitCombinedEmsFd(unit.unit)
      ? generateCallsign(unit.unit, "pairedUnitTemplate")
      : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;
  }

  return (
    <>
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
                    <ImageWrapper
                      quality={70}
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
                      disabled={!props.isUnitOnDuty}
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

      {props.isUnitOnDuty &&
      hasPermissions([Permissions.ManageIncidents, Permissions.ManageEmsFdIncidents], true) ? (
        <ManageIncidentModal
          type={props.type}
          onCreate={(incident) => {
            asyncTable.append(incident as T);
          }}
          onUpdate={(oldIncident, incident) => {
            asyncTable.update(oldIncident.id, { ...oldIncident, ...(incident as T) });
          }}
          onClose={() => incidentState.setTempId(null)}
          incident={tempIncident}
        />
      ) : null}

      {hasPermissions(
        [Permissions.ManageIncidents, Permissions.ManageEmsFdIncidents],
        user?.isSupervisor ?? false,
      ) ? (
        <AlertModal
          id={ModalIds.AlertDeleteIncident}
          title={t("deleteIncident")}
          description={t("alert_deleteIncident")}
          onDeleteClick={handleDelete}
          onClose={() => incidentState.setTempId(null)}
          state={state}
        />
      ) : null}
    </>
  );
}
