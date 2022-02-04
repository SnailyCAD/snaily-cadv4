import * as React from "react";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { ExpungementRequest, Warrant, Citizen, ExpungementRequestStatus } from "@snailycad/types";
import { Button } from "components/Button";
import { useTranslations } from "use-intl";
import { useModal } from "context/ModalContext";
import { requestAll } from "lib/utils";
import { Table } from "components/shared/Table";
import { ModalIds } from "types/ModalIds";
import dynamic from "next/dynamic";
import type { FullRecord } from "components/leo/modals/NameSearchModal/RecordsArea";
import { getTitles } from "components/courthouse/RequestExpungement";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";

const RequestExpungement = dynamic(
  async () => (await import("components/courthouse/RequestExpungement")).RequestExpungement,
);

export type FullRequest = ExpungementRequest & {
  warrants: Warrant[];
  records: FullRecord[];
  citizen: Citizen;
};

interface Props {
  requests: FullRequest[];
}

export default function Courthouse(props: Props) {
  const { openModal } = useModal();
  const [requests, setRequests] = React.useState<FullRequest[]>(props.requests);
  const common = useTranslations("Common");
  const t = useTranslations("Courthouse");
  const leo = useTranslations("Leo");

  return (
    <Layout className="dark:text-white">
      <Title>{t("courthouse")}</Title>

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
          data={requests.map((request) => {
            // accept requests delete the db entity, this results in show "NONE" for the type
            // therefore it shows "ACCEPTED"
            const warrants =
              request.status === ExpungementRequestStatus.ACCEPTED
                ? "accepted"
                : request.warrants.map((w) => w.description).join(", ") || common("none");

            const arrestReports =
              request.status === ExpungementRequestStatus.ACCEPTED
                ? "accepted"
                : request.records
                    .filter((v) => v.type === "ARREST_REPORT")
                    .map((w) => getTitles(w))
                    .join(", ") || common("none");

            const tickets =
              request.status === ExpungementRequestStatus.ACCEPTED
                ? "accepted"
                : request.records
                    .filter((v) => v.type === "TICKET")
                    .map((w) => getTitles(w))
                    .join(", ") || common("none");

            return {
              rowProps: {
                className:
                  request.status !== ExpungementRequestStatus.PENDING
                    ? "opacity-50 cursor-not-allowed"
                    : "",
              },
              citizen: `${request.citizen.name} ${request.citizen.surname}`,
              warrants,
              arrestReports,
              tickets,
              status: request.status.toLowerCase(),
              createdAt: <FullDate>{request.createdAt}</FullDate>,
              actions: <></>,
            };
          })}
          columns={[
            { Header: leo("citizen"), accessor: "citizen" },
            { Header: leo("warrants"), accessor: "warrants" },
            { Header: leo("arrestReports"), accessor: "arrestReports" },
            { Header: leo("tickets"), accessor: "tickets" },
            { Header: leo("status"), accessor: "status" },
            { Header: common("createdAt"), accessor: "createdAt" },
          ]}
        />
      )}

      <RequestExpungement onSuccess={(json) => setRequests((p) => [json, ...p])} />
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
