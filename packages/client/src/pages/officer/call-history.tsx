import * as React from "react";
import Head from "next/head";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { AssignedUnit } from "types/prisma";
import { Table } from "components/table/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import format from "date-fns/format";
import { Full911Call } from "state/dispatchState";

interface Props {
  data: Full911Call[];
}

export default function CallHistory({ data: calls }: Props) {
  const t = useTranslations("Calls");
  const leo = useTranslations("Leo");
  const common = useTranslations("Common");
  const generateCallsign = useGenerateCallsign();

  function makeUnit(unit: AssignedUnit) {
    return "officers" in unit.unit
      ? unit.unit.callsign
      : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;
  }

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>{leo("callHistory")} - SnailyCAD</title>
      </Head>

      <h1 className="mb-3 text-3xl font-semibold">{leo("callHistory")}</h1>

      {calls.length <= 0 ? (
        <p className="mt-5">{"No calls ended yet."}</p>
      ) : (
        <Table
          defaultSort={{ columnId: "createdAt", descending: true }}
          data={calls.map((call) => {
            const createdAt = format(new Date(call.createdAt), "yyyy-MM-dd");

            return {
              caller: call.name,
              location: call.location,
              postal: call.postal,
              description: call.description,
              assignedUnits: call.assignedUnits.map(makeUnit).join(", ") || common("none"),
              createdAt,
            };
          })}
          columns={[
            { Header: t("caller"), accessor: "caller" },
            { Header: t("location"), accessor: "location" },
            { Header: t("postal"), accessor: "postal" },
            { Header: common("description"), accessor: "description" },
            { Header: t("assignedUnits"), accessor: "assignedUnits" },
            { Header: common("createdAt"), accessor: "createdAt" },
          ]}
        />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [calls] = await requestAll(req, [["/911-calls", []]]);

  return {
    props: {
      session: await getSessionUser(req),
      data: calls,
      messages: {
        ...(await getTranslations(["leo", "calls", "common"], locale)),
      },
    },
  };
};
