import * as React from "react";
import { Table } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "next-intl";
import type { FullRequest } from "src/pages/courthouse";
import { ExpungementRequestStatus } from "@snailycad/types";
import dynamic from "next/dynamic";
import { getTitles } from "./RequestExpungement";
import { Status } from "components/shared/Status";
import { FullDate } from "components/shared/FullDate";
import { useModal } from "context/ModalContext";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";

const RequestExpungement = dynamic(
  async () => (await import("./RequestExpungement")).RequestExpungement,
);

interface Props {
  requests: FullRequest[];
}

export function ExpungementRequestsTab(props: Props) {
  const [requests, setRequests] = React.useState<FullRequest[]>(props.requests);
  const common = useTranslations("Common");
  const t = useTranslations("Courthouse");
  const leo = useTranslations("Leo");
  const { openModal } = useModal();

  return (
    <TabsContent value="expungementRequestsTab">
      <header className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">{t("expungementRequests")}</h3>

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
              status: <Status state={request.status}>{request.status.toLowerCase()}</Status>,
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
    </TabsContent>
  );
}
