import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { Button, buttonVariants } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { requestAll } from "lib/utils";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useAreaOfPlay } from "hooks/global/useAreaOfPlay";
import { Title } from "components/shared/Title";
import { CitizenList } from "components/citizen/citizen-list/citizen-list";
import type { GetCitizensData } from "@snailycad/types/api";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { ValueType } from "@snailycad/types";
import { useSignal100 } from "hooks/shared/useSignal100";

const RegisterVehicleModal = dynamic(
  async () =>
    (await import("components/citizen/vehicles/modals/register-vehicle-modal"))
      .RegisterVehicleModal,
  { ssr: false },
);
const RegisterWeaponModal = dynamic(
  async () =>
    (await import("components/citizen/weapons/register-weapon-modal")).RegisterWeaponModal,
  { ssr: false },
);
const ManageCallModal = dynamic(
  async () => (await import("components/citizen/tow/manage-tow-call")).ManageCallModal,
  { ssr: false },
);
const Manage911CallModal = dynamic(
  async () => (await import("components/dispatch/modals/Manage911CallModal")).Manage911CallModal,
  { ssr: false },
);

interface Props {
  citizens: GetCitizensData;
}

export default function CitizenPage({ citizens }: Props) {
  useLoadValuesClientSide({
    valueTypes: [ValueType.LICENSE],
  });

  const t = useTranslations("Citizen");
  const { SIGNAL_100_CITIZEN, TOW, TAXI, WEAPON_REGISTRATION, CALLS_911 } = useFeatureEnabled();

  const { openModal, closeModal } = useModal();
  const [modal, setModal] = React.useState<string | null>(null);
  const { showAop, areaOfPlay } = useAreaOfPlay();
  const signal100 = useSignal100();

  return (
    <Layout className="dark:text-white">
      {SIGNAL_100_CITIZEN ? (
        <signal100.Component enabled={signal100.enabled} audio={signal100.audio} />
      ) : null}

      <header className="my-3">
        <Title className="mb-2">{t("citizens")}</Title>
        {showAop ? <h2 className="font-semibold text-xl">AOP: {areaOfPlay}</h2> : null}
      </header>

      <ul className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-2 md:grid-cols-3">
        <li>
          <Link
            href="/citizen/create"
            className={`rounded-md transition-all p-1 px-4 ${buttonVariants.default} block w-full`}
          >
            {t("createCitizen")}
          </Link>
        </li>
        <li>
          <Button onPress={() => openModal(ModalIds.RegisterVehicle)} className="text-left w-full">
            {t("registerVehicle")}
          </Button>
        </li>
        {WEAPON_REGISTRATION ? (
          <li>
            <Button onPress={() => openModal(ModalIds.RegisterWeapon)} className="text-left w-full">
              {t("registerWeapon")}
            </Button>
          </li>
        ) : null}

        {TOW ? (
          <li>
            <Button
              onPress={() => {
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
              onPress={() => {
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
            <Button onPress={() => openModal(ModalIds.Manage911Call)} className="text-left w-full">
              {t("create911Call")}
            </Button>
          </li>
        ) : null}
      </ul>

      <CitizenList citizens={citizens} />

      <RegisterVehicleModal onCreate={() => closeModal(ModalIds.RegisterVehicle)} vehicle={null} />
      {WEAPON_REGISTRATION ? (
        <RegisterWeaponModal onCreate={() => closeModal(ModalIds.RegisterWeapon)} weapon={null} />
      ) : null}
      {CALLS_911 ? <Manage911CallModal call={null} /> : null}
      {TOW || TAXI ? <ManageCallModal isTow={modal === "tow"} call={null} /> : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/citizen", { citizens: [], totalCount: 0 }]]);

  return {
    props: {
      citizens: data,
      session: user,
      messages: {
        ...(await getTranslations(["citizen", "leo", "calls", "common"], user?.locale ?? locale)),
      },
    },
  };
};
