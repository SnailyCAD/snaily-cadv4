import * as React from "react";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Button } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { TowTaxiCallsTable } from "components/citizen/tow/tow-taxi-calls-table";
import { Permissions } from "@snailycad/permissions";
import type { GetTaxiCallsData } from "@snailycad/types/api";

interface Props {
  initialData: GetTaxiCallsData;
}

export default function Taxi(props: Props) {
  const modalState = useModal();
  const t = useTranslations("Calls");

  function onCreateClick() {
    modalState.openModal(ModalIds.ManageTowCall);
  }

  return (
    <Layout
      permissions={{
        permissions: [Permissions.ViewTaxiCalls, Permissions.ManageTaxiCalls],
      }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between mb-5">
        <Title>{t("taxi")}</Title>

        <Button onPress={onCreateClick}>{t("createTaxiCall")}</Button>
      </header>

      <TowTaxiCallsTable
        type="taxi"
        noCallsText={t("noTaxiCalls")}
        initialData={props.initialData}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/taxi", { totalCount: 0, calls: [] }]]);

  return {
    props: {
      initialData: data,
      session: user,
      messages: {
        ...(await getTranslations(["calls", "leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
