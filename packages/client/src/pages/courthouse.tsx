import * as React from "react";
import Head from "next/head";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { ExpungementRequest, Warrant, Record } from "types/prisma";
import { Button } from "components/Button";
import { useTranslations } from "use-intl";
import { useModal } from "context/ModalContext";
import { requestAll } from "lib/utils";
import { Table } from "components/table/Table";
import format from "date-fns/format";

export type FullRequest = ExpungementRequest & { warrants: Warrant[]; records: Record[] };

interface Props {
  requests: FullRequest[];
}

export default function Taxi(props: Props) {
  const { openModal } = useModal();
  const [requests] = React.useState<FullRequest[]>(props.requests);
  const common = useTranslations("Common");
  const t = useTranslations("Courthouse");

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>{t("courthouse")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-semibold">{t("courthouse")}</h1>

        <Button onClick={() => openModal("")}>{t("requestExpungement")}</Button>
      </header>

      {requests.length <= 0 ? (
        <p className="mt-5">{t("noExpungementRequests")}</p>
      ) : (
        <Table
          data={requests.map((request) => ({
            warrants: request.warrants.map((w) => w.description).join(", "),
            arrestReports: "",
            tickets: "",
            createdAt: format(new Date(request.createdAt), "yyyy-MM-dd - hh:mm:ss"),
            actions: <></>,
          }))}
          columns={[
            { Header: t("warrants"), accessor: "warrants" },
            { Header: t("arrestReports"), accessor: "arrestReports" },
            { Header: t("tickets"), accessor: "tickets" },
            { Header: common("createdAt"), accessor: "createdAt" },
          ]}
        />
      )}

      {/* <AssignToCallModal onSuccess={updateCalls} call={tempCall} />
      <ManageCallModal onDelete={handleCallEnd} onUpdate={updateCalls} call={tempCall} /> */}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data, citizens] = await requestAll(req, [
    ["/taxi", []],
    ["/citizen", []],
  ]);

  return {
    props: {
      requests: data,
      citizens,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["courthouse", "common"], locale)),
      },
    },
  };
};
