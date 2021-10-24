import * as React from "react";
import type { GetServerSideProps } from "next";
import type { Citizen } from "types/prisma";
import Link from "next/link";
import { Layout } from "components/Layout";
import { handleRequest } from "lib/fetch";
import { getSessionUser } from "lib/auth";
import Head from "next/head";
import { getTranslations } from "lib/getTranslation";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { RegisterVehicleModal } from "components/citizen/modals/RegisterVehicleModal";
import { RegisterWeaponModal } from "components/citizen/modals/RegisterWeaponModal";
import { PersonFill } from "react-bootstrap-icons";
import { makeImageUrl } from "lib/utils";
import { ManageCallModal } from "components/citizen/tow/ManageTowCall";
import { Manage911CallModal } from "components/modals/Manage911CallModal";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useAreaOfPlay } from "hooks/useAreaOfPlay";

interface Props {
  citizens: Citizen[];
}

export default function CitizenPage({ citizens }: Props) {
  const t = useTranslations("Citizen");
  const { openModal, closeModal } = useModal();
  const [modal, setModal] = React.useState<string | null>(null);
  const { TOW, TAXI } = useFeatureEnabled();
  const { showAop, areaOfPlay } = useAreaOfPlay();

  return (
    <Layout>
      <Head>
        <title>{t("citizens")} - SnailyCAD</title>
      </Head>

      <h1 className="text-3xl font-semibold mb-3">
        Citizens{showAop ? <span> - AOP: {areaOfPlay}</span> : null}
      </h1>

      <ul className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-3">
        <Link href="/citizen/create">
          <a className="py-1.5 px-3 text-white bg-gray-500 hover:bg-gray-600 rounded-md transition-all">
            {t("createCitizen")}
          </a>
        </Link>
        <Button onClick={() => openModal(ModalIds.RegisterVehicle)} className="text-left">
          {t("registerVehicle")}
        </Button>
        <Button onClick={() => openModal(ModalIds.RegisterWeapon)} className="text-left">
          {t("registerWeapon")}
        </Button>
      </ul>

      <ul className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-3">
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
        <Button onClick={() => openModal(ModalIds.Manage911Call)} className="text-left">
          {t("create911Call")}
        </Button>
      </ul>

      <ul
        className={
          citizens.length <= 0 ? "flex flex-col space-y-3" : "grid grid-cols-1 sm:grid-cols-2 gap-2"
        }
      >
        {citizens.length <= 0 ? (
          <p className="text-gray-600 font-medium">{t("userNoCitizens")}</p>
        ) : (
          citizens.map((citizen) => (
            <li
              key={citizen.id}
              className="p-3  bg-gray-200 rounded-md flex justify-between items-center"
            >
              <div className="flex items-center space-x-3">
                {citizen.imageId ? (
                  <img
                    draggable={false}
                    className="rounded-full w-14"
                    src={makeImageUrl("citizens", citizen.imageId)}
                  />
                ) : (
                  <PersonFill className="text-gray-500/60 w-12 h-12" />
                )}

                <p className="text-xl font-semibold">
                  {citizen.name} {citizen.surname}
                </p>
              </div>

              <div>
                <Link href={`/citizen/${citizen.id}`}>
                  <a className="py-1.5 px-3 text-white bg-gray-500 hover:bg-gray-600 rounded-md transition-all">
                    {t("viewCitizen")}
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
  const { data } = await handleRequest<any[]>("/citizen", {
    headers: req.headers,
  }).catch(() => ({ data: null }));

  const { data: values = [] } = await handleRequest(
    "/admin/values/weapon?paths=license,vehicle",
  ).catch(() => ({ data: null }));

  return {
    props: {
      values,
      citizens: data ?? [],
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["citizen", "calls", "common"], locale)),
      },
    },
  };
};
