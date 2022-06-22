import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import type { Citizen, User } from "@snailycad/types";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { Button, buttonVariants } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { requestAll } from "lib/utils";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useAreaOfPlay } from "hooks/global/useAreaOfPlay";
import { Title } from "components/shared/Title";
import { CitizenList } from "components/citizen/citizen-list/CitizenList";

const RegisterVehicleModal = dynamic(
  async () =>
    (await import("components/citizen/vehicles/modals/RegisterVehicleModal")).RegisterVehicleModal,
);
const RegisterWeaponModal = dynamic(
  async () => (await import("components/citizen/weapons/RegisterWeaponModal")).RegisterWeaponModal,
);
const ManageCallModal = dynamic(
  async () => (await import("components/citizen/tow/ManageTowCall")).ManageCallModal,
);
const Manage911CallModal = dynamic(
  async () => (await import("components/dispatch/modals/Manage911CallModal")).Manage911CallModal,
);

interface Props {
  citizens: { citizens: (Citizen & { user?: Pick<User, "username"> })[]; totalCount: number };
}

export default function CitizenPage({ citizens }: Props) {
  const t = useTranslations("Citizen");
  const { TOW, TAXI, WEAPON_REGISTRATION, CALLS_911 } = useFeatureEnabled();

  const { openModal, closeModal } = useModal();
  const [modal, setModal] = React.useState<string | null>(null);
  const { showAop, areaOfPlay } = useAreaOfPlay();

  return (
    <Layout className="dark:text-white">
      <Title renderLayoutTitle={false}>{t("citizens")}</Title>

      <h1 className="mb-3 text-3xl font-semibold">
        {t("citizens")}
        {showAop ? <span> - AOP: {areaOfPlay}</span> : null}
      </h1>

      <ul className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-2 md:grid-cols-3">
        <li>
          <Link href="/citizen/create">
            <a
              href="/citizen/create"
              className={`rounded-md transition-all p-1 px-4 ${buttonVariants.default} block w-full`}
            >
              {t("createCitizen")}
            </a>
          </Link>
        </li>
        <li>
          <Button onClick={() => openModal(ModalIds.RegisterVehicle)} className="text-left w-full">
            {t("registerVehicle")}
          </Button>
        </li>
        {WEAPON_REGISTRATION ? (
          <li>
            <Button onClick={() => openModal(ModalIds.RegisterWeapon)} className="text-left w-full">
              {t("registerWeapon")}
            </Button>
          </li>
        ) : null}

        {TOW ? (
          <li>
            <Button
              onClick={() => {
                setModal("tow");
                openModal(ModalIds.ManageTowCall);
              }}
              className="text-left w-full"
            >
              {t("createTowCall")}
            </Button>
          </li>
        ) : null}
        {TAXI ? (
          <li>
            <Button
              onClick={() => {
                setModal("taxi");
                openModal(ModalIds.ManageTowCall);
              }}
              className="text-left w-full"
            >
              {t("createTaxiCall")}
            </Button>
          </li>
        ) : null}
        {CALLS_911 ? (
          <li>
            <Button onClick={() => openModal(ModalIds.Manage911Call)} className="text-left w-full">
              {t("create911Call")}
            </Button>
          </li>
        ) : null}
      </ul>

      <CitizenList citizens={citizens} />

      <RegisterVehicleModal onCreate={() => closeModal(ModalIds.RegisterVehicle)} vehicle={null} />

      <RegisterWeaponModal onCreate={() => closeModal(ModalIds.RegisterWeapon)} weapon={null} />
      <Manage911CallModal call={null} />
      <ManageCallModal isTow={modal === "tow"} call={null} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data, values] = await requestAll(req, [
    ["/citizen", []],
    ["/admin/values/license", []],
  ]);

  return {
    props: {
      values,
      citizens: data ?? [],
      session: user,
      messages: {
        ...(await getTranslations(["citizen", "calls", "common"], user?.locale ?? locale)),
      },
    },
  };
};
