import * as React from "react";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { TowTaxiCallsTable } from "components/citizen/tow/tow-taxi-calls-table";
import { Permissions } from "@snailycad/permissions";
import type { GetTowCallsData } from "@snailycad/types/api";

interface Props {
  initialData: GetTowCallsData;
}

export default function Tow(props: Props) {
  const modalState = useModal();
  const t = useTranslations("Calls");

  function onCreateClick() {
    modalState.openModal(ModalIds.ManageTowCall);
  }

  return (
    <Layout
      permissions={{
        permissions: [
          Permissions.ViewTowCalls,
          Permissions.ViewTowLogs,
          Permissions.ManageTowCalls,
        ],
      }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between mb-5">
        <Title className="!mb-0">{t("tow")}</Title>

        <Button onPress={onCreateClick}>{t("createTowCall")}</Button>
      </header>

      <TowTaxiCallsTable initialData={props.initialData} type="tow" noCallsText={t("noTowCalls")} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/tow", { totalCount: 0, calls: [] }]]);

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
