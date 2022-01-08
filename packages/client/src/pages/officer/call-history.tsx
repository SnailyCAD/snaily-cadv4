import * as React from "react";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { AssignedUnit, LeoIncident } from "types/prisma";
import { Table } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import format from "date-fns/format";
import { Full911Call } from "state/dispatchState";
import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { LinkCallToIncidentModal } from "components/leo/call-history/LinkCallToIncidentModal";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { useRouter } from "next/router";
import { Title } from "components/shared/Title";

interface Props {
  data: (Full911Call & { incidents: LeoIncident[] })[];
  incidents: LeoIncident[];
}

export default function CallHistory({ data: calls, incidents }: Props) {
  const [tempCall, setTempCall] = React.useState<Full911Call | null>(null);
  const [search, setSearch] = React.useState("");
  const { state, execute } = useFetch();
  const router = useRouter();

  const { openModal } = useModal();
  const t = useTranslations("Calls");
  const leo = useTranslations("Leo");
  const common = useTranslations("Common");
  const generateCallsign = useGenerateCallsign();

  function handleLinkClick(call: Full911Call) {
    setTempCall(call);
    openModal(ModalIds.LinkCallToIncident);
  }

  async function handlePurge(ids: string[]) {
    const { json } = await execute("/911-calls/purge", {
      method: "DELETE",
      data: { ids },
    });

    if (json) {
      router.replace({ pathname: router.pathname, query: router.query });
    }
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
        <Table
          selection={{
            enabled: true,
          }}
          Toolbar={({ instance }) => {
            const rows = instance.selectedFlatRows ?? [];
            const isDisabled = state === "loading" || rows.length <= 0;

            return (
              <div className="mb-2">
                <FormField label={common("search")} className="my-2">
                  <div className="flex gap-2">
                    <Input onChange={(e) => setSearch(e.target.value)} value={search} />
                    <Button
                      onClick={() => handlePurge(rows.map((r) => r.original.rowProps.call.id))}
                      className="ml-2 min-w-fit flex gap-2 items-center"
                      disabled={isDisabled}
                    >
                      {state === "loading" ? <Loader /> : null}
                      Purge selected
                    </Button>
                  </div>
                </FormField>
              </div>
            );
          }}
          filter={search}
          defaultSort={{ columnId: "createdAt", descending: true }}
          data={calls.map((call) => {
            const createdAt = format(new Date(call.createdAt), "yyyy-MM-dd");
            const caseNumbers = call.incidents.map((i) => `#${i.caseNumber}`).join(", ");

            return {
              rowProps: { call },
              caller: call.name,
              location: call.location,
              postal: call.postal,
              description: call.description,
              assignedUnits: call.assignedUnits.map(makeUnit).join(", ") || common("none"),
              caseNumbers: caseNumbers || common("none"),
              createdAt,
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
      )}

      <LinkCallToIncidentModal incidents={incidents} call={tempCall} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [calls, incidents] = await requestAll(req, [
    ["/911-calls?includeEnded=true", []],
    ["/incidents", []],
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
