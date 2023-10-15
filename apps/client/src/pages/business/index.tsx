import * as React from "react";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useBusinessState } from "state/business-state";
import { Layout } from "components/Layout";
import { Button } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { BusinessCard } from "components/business/business-card";
import dynamic from "next/dynamic";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { usePermission, Permissions } from "hooks/usePermission";
import type { GetBusinessesData } from "@snailycad/types/api";

const CreateBusinessModal = dynamic(
  async () => (await import("components/business/create-business-modal")).CreateBusinessModal,
);

const JoinBusinessModal = dynamic(
  async () => (await import("components/business/join-business-modal")).JoinBusinessModal,
);

export default function BusinessPage(props: GetBusinessesData) {
  const modalState = useModal();
  const t = useTranslations("Business");
  const setJoinableBusinesses = useBusinessState((s) => s.setJoinableBusinesses);
  const { hasPermissions } = usePermission();
  const hasCreateBusinessesPerms = hasPermissions([Permissions.CreateBusinesses]);

  React.useEffect(() => {
    setJoinableBusinesses(props.joinableBusinesses);
  }, [props.joinableBusinesses, setJoinableBusinesses]);

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between mb-3">
        <Title className="!mb-0">{t("businesses")}</Title>

        <div>
          <Button onPress={() => modalState.openModal(ModalIds.JoinBusiness)}>
            {t("joinBusiness")}
          </Button>
          {hasCreateBusinessesPerms ? (
            <Button className="ml-2" onPress={() => modalState.openModal(ModalIds.CreateBusiness)}>
              {t("createBusiness")}
            </Button>
          ) : null}
        </div>
      </header>

      <section>
        <h3 className="text-xl font-semibold mb-2">{t("owned")}</h3>
        <ul className="space-y-3">
          {props.ownedBusinesses.length <= 0 ? (
            <p className="text-neutral-700 dark:text-gray-400">{t("noOwned")}</p>
          ) : (
            props.ownedBusinesses.map((employee) => (
              <BusinessCard key={employee.id} employee={employee} />
            ))
          )}
        </ul>
      </section>

      <section className="mt-3">
        <h3 className="text-xl font-semibold mb-2">{t("joined")}</h3>
        <ul className="space-y-3">
          {props.joinedBusinesses.length <= 0 ? (
            <p className="text-neutral-700 dark:text-gray-400">{t("notEmployee")}</p>
          ) : (
            props.joinedBusinesses.map((employee) => (
              <BusinessCard key={employee.id} employee={employee} />
            ))
          )}
        </ul>
      </section>

      <JoinBusinessModal />
      {hasCreateBusinessesPerms ? <CreateBusinessModal /> : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<GetBusinessesData> = async ({
  locale,
  req,
}) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [
    ["/businesses", { ownedBusinesses: [], joinedBusinesses: [], joinableBusinesses: [] }],
  ]);

  return {
    props: {
      ...data,
      session: user,
      messages: {
        ...(await getTranslations(["business", "common"], user?.locale ?? locale)),
      },
    },
  };
};
