import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { PersonFill } from "react-bootstrap-icons";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import type { Citizen } from "@snailycad/types";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { requestAll } from "lib/utils";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useAreaOfPlay } from "hooks/global/useAreaOfPlay";
import { useImageUrl } from "hooks/useImageUrl";
import { Title } from "components/shared/Title";

const RegisterVehicleModal = dynamic(
  async () =>
    (await import("components/citizen/vehicles/RegisterVehicleModal")).RegisterVehicleModal,
);
const RegisterWeaponModal = dynamic(
  async () => (await import("components/citizen/weapons/RegisterWeaponModal")).RegisterWeaponModal,
);
const ManageCallModal = dynamic(
  async () => (await import("components/citizen/tow/ManageTowCall")).ManageCallModal,
);
const Manage911CallModal = dynamic(
  async () => (await import("components/modals/Manage911CallModal")).Manage911CallModal,
);

interface Props {
  citizens: Citizen[];
}

export default function CitizenPage({ citizens }: Props) {
  const t = useTranslations("Citizen");
  const { openModal, closeModal } = useModal();
  const [modal, setModal] = React.useState<string | null>(null);
  const { TOW, TAXI, WEAPON_REGISTRATION, CALLS_911 } = useFeatureEnabled();
  const { showAop, areaOfPlay } = useAreaOfPlay();
  const { makeImageUrl } = useImageUrl();

  return (
    <Layout className="dark:text-white">
      <Title>{t("citizens")}</Title>

      <h1 className="mb-3 text-3xl font-semibold">
        {t("citizens")}
        {showAop ? <span> - AOP: {areaOfPlay}</span> : null}
      </h1>

      <ul className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-2 md:grid-cols-3">
        <Link href="/citizen/create">
          <a>
            <Button className="w-full text-left">{t("createCitizen")}</Button>
          </a>
        </Link>
        <Button onClick={() => openModal(ModalIds.RegisterVehicle)} className="text-left">
          {t("registerVehicle")}
        </Button>
        {WEAPON_REGISTRATION ? (
          <Button onClick={() => openModal(ModalIds.RegisterWeapon)} className="text-left">
            {t("registerWeapon")}
          </Button>
        ) : null}

        {TOW ? (
          <Button
            onClick={() => {
              setModal("tow");
              openModal(ModalIds.ManageTowCall);
            }}
            className="text-left"
          >
            {t("createTowCall")}
          </Button>
        ) : null}
        {TAXI ? (
          <Button
            onClick={() => {
              setModal("taxi");
              openModal(ModalIds.ManageTowCall);
            }}
            className="text-left"
          >
            {t("createTaxiCall")}
          </Button>
        ) : null}
        {CALLS_911 ? (
          <Button onClick={() => openModal(ModalIds.Manage911Call)} className="text-left">
            {t("create911Call")}
          </Button>
        ) : null}
      </ul>

      <ul
        className={
          citizens.length <= 0 ? "flex flex-col space-y-3" : "grid grid-cols-1 sm:grid-cols-2 gap-2"
        }
      >
        {citizens.length <= 0 ? (
          <p className="font-medium text-gray-600 dark:text-gray-300">{t("userNoCitizens")}</p>
        ) : (
          citizens.map((citizen) => (
            <li
              key={citizen.id}
              className="flex items-center justify-between p-3 bg-gray-200 rounded-md dark:bg-gray-2"
            >
              <div className="flex items-center space-x-3">
                {citizen.imageId ? (
                  <img
                    draggable={false}
                    className="object-cover rounded-full w-14 h-14"
                    src={makeImageUrl("citizens", citizen.imageId)}
                  />
                ) : (
                  <PersonFill className="w-12 h-12 text-gray-500/60" />
                )}

                <p className="text-xl font-semibold">
                  {citizen.name} {citizen.surname}
                </p>
              </div>

              <div>
                <Link href={`/citizen/${citizen.id}`}>
                  <a>
                    <Button>{t("viewCitizen")}</Button>
                  </a>
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>

      <RegisterVehicleModal
        onCreate={() => closeModal(ModalIds.RegisterVehicle)}
        citizens={citizens}
        vehicle={null}
      />

      <RegisterWeaponModal
        onCreate={() => closeModal(ModalIds.RegisterWeapon)}
        citizens={citizens}
        weapon={null}
      />
      <Manage911CallModal call={null} />
      <ManageCallModal isTow={modal === "tow"} call={null} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req }) => {
  const [data, values] = await requestAll(req, [
    ["/citizen", []],
    ["/admin/values/weapon?paths=license,vehicle", []],
  ]);

  return {
    props: {
      values,
      citizens: data ?? [],
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "calls", "common"], locale)),
      },
    },
  };
};
