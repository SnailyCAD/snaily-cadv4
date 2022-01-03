import * as React from "react";
import Head from "next/head";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { ExpungementRequest, Warrant, Record, Citizen } from "types/prisma";
import { Button } from "components/Button";
import { useTranslations } from "use-intl";
import { useModal } from "context/ModalContext";
import { requestAll } from "lib/utils";
import { Table } from "components/table/Table";
import format from "date-fns/format";
import { ModalIds } from "types/ModalIds";
import dynamic from "next/dynamic";

const RequestExpungement = dynamic(
  async () => (await import("components/courthouse/RequestExpungement")).RequestExpungement,
);

export type FullRequest = ExpungementRequest & {
  warrants: Warrant[];
  records: Record[];
  citizen: Citizen;
};

interface Props {
  requests: FullRequest[];
}

export default function Courthouse(props: Props) {
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

        <Button onClick={() => openModal(ModalIds.RequestExpungement)}>
          {t("requestExpungement")}
        </Button>
      </header>

      {requests.length <= 0 ? (
        <p className="mt-5">{t("noExpungementRequests")}</p>
      ) : (
        <Table
          data={requests.map((request) => ({
            citizen: `${request.citizen.name} ${request.citizen.surname}`,
            warrants: request.warrants.map((w) => w.description).join(", "),
            arrestReports: "",
            tickets: "",
            createdAt: format(new Date(request.createdAt), "yyyy-MM-dd - hh:mm:ss"),
            actions: <></>,
          }))}
          columns={[
            { Header: t("citizen"), accessor: "warrants" },
            { Header: t("warrants"), accessor: "warrants" },
            { Header: t("arrestReports"), accessor: "arrestReports" },
            { Header: t("tickets"), accessor: "tickets" },
            { Header: common("createdAt"), accessor: "createdAt" },
          ]}
        />
      )}

      <RequestExpungement />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data, citizens] = await requestAll(req, [
    ["/expungement-requests", []],
    ["/citizen", []],
  ]);

  return {
    props: {
      requests: data,
      citizens,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["courthouse", "leo", "common"], locale)),
      },
    },
  };
};
