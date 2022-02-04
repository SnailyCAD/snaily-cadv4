import * as React from "react";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import type { AssignedUnit, LeoIncident } from "@snailycad/types";
import { IndeterminateCheckbox, Table } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import type { Full911Call } from "state/dispatchState";
import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { LinkCallToIncidentModal } from "components/leo/call-history/LinkCallToIncidentModal";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { useRouter } from "next/router";
import { Title } from "components/shared/Title";
import dynamic from "next/dynamic";
import { FullDate } from "components/shared/FullDate";
import { AlertModal } from "components/modal/AlertModal";
import { useTableSelect } from "hooks/shared/useTableSelect";

const DescriptionModal = dynamic(
  async () => (await import("components/modal/DescriptionModal/DescriptionModal")).DescriptionModal,
);

interface Props {
  data: (Full911Call & { incidents: LeoIncident[] })[];
  incidents: LeoIncident[];
}

export default function CallHistory({ data: calls, incidents }: Props) {
  const [tempCall, setTempCall] = React.useState<Full911Call | null>(null);
  const [search, setSearch] = React.useState("");

  const { state, execute } = useFetch();
  const router = useRouter();
  const tableSelect = useTableSelect(calls);

  const { openModal, closeModal } = useModal();
  const t = useTranslations("Calls");
  const leo = useTranslations("Leo");
  const common = useTranslations("Common");
  const generateCallsign = useGenerateCallsign();

  function handleLinkClick(call: Full911Call) {
    setTempCall(call);
    openModal(ModalIds.LinkCallToIncident);
  }

  async function handlePurge() {
    const { json } = await execute("/911-calls/purge", {
      method: "DELETE",
      data: { ids: tableSelect.selectedRows },
    });

    if (json) {
      router.replace({ pathname: router.pathname, query: router.query });
      tableSelect.resetRows();
      closeModal(ModalIds.AlertPurgeCalls);
    }
  }

  function handleViewDescription(call: Full911Call) {
    setTempCall(call);
    openModal(ModalIds.Description, call);
  }

  function makeUnit(unit: AssignedUnit) {
    return "officers" in unit.unit
      ? unit.unit.callsign
      : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;
  }

  return (
    <Layout className="dark:text-white">
      <Title>{leo("callHistory")}</Title>

      <h1 className="mb-3 text-3xl font-semibold">{leo("callHistory")}</h1>

      {calls.length <= 0 ? (
        <p className="mt-5">{"No calls ended yet."}</p>
      ) : (
        <>
          <div className="mb-2">
            <FormField label={common("search")} className="my-2">
              <div className="flex gap-2">
                <Input onChange={(e) => setSearch(e.target.value)} value={search} />
                <Button
                  onClick={() => openModal(ModalIds.AlertPurgeCalls)}
                  className="flex items-center gap-2 ml-2 min-w-fit"
                  disabled={state === "loading" || tableSelect.selectedRows.length <= 0}
                >
                  {state === "loading" ? <Loader /> : null}
                  {t("purgeSelected")}
                </Button>
              </div>
            </FormField>
          </div>

          <Table
            disabledColumnId={["checkbox"]}
            filter={search}
            defaultSort={{ columnId: "createdAt", descending: true }}
            data={calls.map((call) => {
              const caseNumbers = call.incidents.map((i) => `#${i.caseNumber}`).join(", ");
              return {
                checkbox: (
                  <input
                    checked={tableSelect.selectedRows.includes(call.id)}
                    onChange={() => tableSelect.handleCheckboxChange(call)}
                    type="checkbox"
                  />
                ),
                rowProps: { call },
                caller: call.name,
                location: call.location,
                postal: call.postal,
                description:
                  call.description && !call.descriptionData ? (
                    call.description
                  ) : (
                    <Button small onClick={() => handleViewDescription(call)}>
                      {common("viewDescription")}
                    </Button>
                  ),
                assignedUnits: call.assignedUnits.map(makeUnit).join(", ") || common("none"),
                caseNumbers: caseNumbers || common("none"),
                createdAt: <FullDate>{call.createdAt}</FullDate>,
                actions: (
                  <>
                    <Button onClick={() => handleLinkClick(call)} small>
                      {leo("linkToIncident")}
                    </Button>
                  </>
                ),
              };
            })}
            columns={[
              {
                Header: (
                  <IndeterminateCheckbox
                    onChange={tableSelect.handleAllCheckboxes}
                    checked={tableSelect.isTopCheckboxChecked}
                    indeterminate={tableSelect.isIntermediate}
                  />
                ),
                accessor: "checkbox",
              },
              { Header: t("caller"), accessor: "caller" },
              { Header: t("location"), accessor: "location" },
              { Header: t("postal"), accessor: "postal" },
              { Header: common("description"), accessor: "description" },
              { Header: t("assignedUnits"), accessor: "assignedUnits" },
              { Header: leo("caseNumbers"), accessor: "caseNumbers" },
              { Header: common("createdAt"), accessor: "createdAt" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        </>
      )}

      <LinkCallToIncidentModal incidents={incidents} call={tempCall} />
      <AlertModal
        title={t("purgeSelectedCalls")}
        description={t.rich("alert_purgeSelectedCalls", {
          length: tableSelect.selectedRows.length,
        })}
        id={ModalIds.AlertPurgeCalls}
        onDeleteClick={handlePurge}
        deleteText={t("purge")}
      />

      {tempCall?.descriptionData ? (
        <DescriptionModal onClose={() => setTempCall(null)} value={tempCall.descriptionData} />
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [calls, { incidents }] = await requestAll(req, [
    ["/911-calls?includeEnded=true", []],
    ["/incidents", [{ incidents: [] }]],
  ]);

  return {
    props: {
      session: await getSessionUser(req),
      data: calls,
      incidents,
      messages: {
        ...(await getTranslations(["leo", "calls", "common"], locale)),
      },
    },
  };
};
