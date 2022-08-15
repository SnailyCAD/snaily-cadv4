import * as React from "react";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { getObjLength, isEmpty, makeUnitName, requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import type { AssignedUnit } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Full911Call, useDispatchState } from "state/dispatch/dispatchState";
import { Button } from "components/Button";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { LinkCallToIncidentModal } from "components/leo/call-history/LinkCallToIncidentModal";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { Title } from "components/shared/Title";
import dynamic from "next/dynamic";
import { FullDate } from "components/shared/FullDate";
import { AlertModal } from "components/modal/AlertModal";
import { Manage911CallModal } from "components/dispatch/modals/Manage911CallModal";
import { isUnitCombined } from "@snailycad/utils";
import { usePermission, Permissions } from "hooks/usePermission";
import type {
  DeletePurge911CallsData,
  Get911CallsData,
  GetDispatchData,
  GetIncidentsData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { getSelectedTableRows } from "hooks/shared/table/useTableState";

const DescriptionModal = dynamic(
  async () => (await import("components/modal/DescriptionModal/DescriptionModal")).DescriptionModal,
);

interface Props extends GetDispatchData {
  data: Get911CallsData;
  incidents: GetIncidentsData["incidents"];
}

export default function CallHistory({ data, incidents, officers, deputies }: Props) {
  const [calls, setCalls] = React.useState(data);
  const [search, setSearch] = React.useState("");
  const dispatchState = useDispatchState();
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageCallHistory], true);
  const [tempCall, callState] = useTemporaryItem(calls.calls);

  const tableState = useTableState({ search: { value: search, setValue: setSearch } });
  const { state, execute } = useFetch();

  const { openModal, closeModal } = useModal();
  const t = useTranslations("Calls");
  const leo = useTranslations("Leo");
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();

  function handleLinkClick(call: Full911Call) {
    callState.setTempId(call.id);
    openModal(ModalIds.LinkCallToIncident);
  }

  function handleViewClick(call: Full911Call) {
    callState.setTempId(call.id);
    openModal(ModalIds.Manage911Call);
  }

  async function handlePurge() {
    const selectedRows = getSelectedTableRows(data, tableState.rowSelection);
    if (selectedRows.length <= 0) return;

    const { json } = await execute<DeletePurge911CallsData>({
      path: "/911-calls/purge",
      method: "DELETE",
      data: { ids: selectedRows },
    });

    if (json) {
      const updatedCalls = calls.filter((call) => !selectedRows.includes(call.id));
      setCalls(updatedCalls);

      closeModal(ModalIds.AlertPurgeCalls);
    }
  }

  function handleViewDescription(call: Full911Call) {
    callState.setTempId(call.id);
    openModal(ModalIds.Description, call);
  }

  function makeUnit(unit: AssignedUnit) {
    if (!unit.unit) return "UNKNOWN";

    return isUnitCombined(unit.unit)
      ? generateCallsign(unit.unit, "pairedUnitTemplate")
      : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;
  }

  React.useEffect(() => {
    dispatchState.setAllOfficers(officers);
    dispatchState.setAllDeputies(deputies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officers, deputies]);

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewCallHistory, Permissions.ManageCallHistory],
      }}
      className="dark:text-white"
    >
      <Title>{leo("callHistory")}</Title>

      {calls.length <= 0 ? (
        <p className="mt-5">{"No calls ended yet."}</p>
      ) : (
        <>
          <div className="mb-2">
            <FormField label={common("search")} className="my-2">
              <div className="flex gap-2">
                <Input onChange={(e) => setSearch(e.target.value)} value={search} />
                {hasManagePermissions ? (
                  <Button
                    onClick={() => openModal(ModalIds.AlertPurgeCalls)}
                    className="flex items-center gap-2 ml-2 min-w-fit"
                    disabled={state === "loading" || isEmpty(tableState.rowSelection)}
                  >
                    {state === "loading" ? <Loader /> : null}
                    {t("purgeSelected")}
                  </Button>
                ) : null}
              </div>
            </FormField>
          </div>

          <Table
            tableState={tableState}
            features={{ rowSelection: hasManagePermissions }}
            data={calls.map((call) => {
              const caseNumbers = (call.incidents ?? []).map((i) => `#${i.caseNumber}`).join(", ");

              return {
                id: call.id,
                rowProps: { call },
                caller: call.name,
                location: call.location,
                postal: call.postal,
                description:
                  call.description && !call.descriptionData ? (
                    call.description
                  ) : (
                    <Button size="xs" onClick={() => handleViewDescription(call)}>
                      {common("viewDescription")}
                    </Button>
                  ),
                assignedUnits: call.assignedUnits.map(makeUnit).join(", ") || common("none"),
                caseNumbers: caseNumbers || common("none"),
                createdAt: <FullDate>{call.createdAt}</FullDate>,
                actions: (
                  <>
                    {hasManagePermissions ? (
                      <Button onClick={() => handleLinkClick(call)} size="xs">
                        {leo("linkToIncident")}
                      </Button>
                    ) : null}
                    <Button className="ml-2" onClick={() => handleViewClick(call)} size="xs">
                      {leo("viewCall")}
                    </Button>
                  </>
                ),
              };
            })}
            columns={[
              { header: t("caller"), accessorKey: "caller" },
              { header: t("location"), accessorKey: "location" },
              { header: t("postal"), accessorKey: "postal" },
              { header: common("description"), accessorKey: "description" },
              { header: t("assignedUnits"), accessorKey: "assignedUnits" },
              { header: leo("caseNumbers"), accessorKey: "caseNumbers" },
              { header: common("createdAt"), accessorKey: "createdAt" },
              { header: common("actions"), accessorKey: "actions" },
            ]}
          />
        </>
      )}

      <LinkCallToIncidentModal
        onSave={(call) => {
          setCalls((calls) =>
            calls.map((c) => {
              if (c.id === call.id) {
                return call;
              }

              return c;
            }),
          );
        }}
        incidents={incidents}
        call={tempCall}
      />
      <AlertModal
        title={t("purgeSelectedCalls")}
        description={t.rich("alert_purgeSelectedCalls", {
          length: getObjLength(tableState.rowSelection),
        })}
        id={ModalIds.AlertPurgeCalls}
        onDeleteClick={handlePurge}
        deleteText={t("purge")}
      />

      {tempCall?.descriptionData ? (
        <DescriptionModal
          onClose={() => callState.setTempId(null)}
          value={tempCall.descriptionData}
        />
      ) : null}

      <Manage911CallModal call={tempCall} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [calls, { incidents }, { deputies, officers }] = await requestAll(req, [
    ["/911-calls?includeEnded=true", []],
    ["/incidents", { incidents: [] }],
    ["/dispatch", { deputies: [], officers: [] }],
  ]);

  return {
    props: {
      session: user,
      data: calls,
      incidents,
      deputies,
      officers,
      messages: {
        ...(await getTranslations(["leo", "calls", "common"], user?.locale ?? locale)),
      },
    },
  };
};
