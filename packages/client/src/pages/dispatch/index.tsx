import * as React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { Layout } from "components/Layout";
import { useAreaOfPlay } from "hooks/useAreaOfPlay";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { ActiveCalls } from "components/leo/ActiveCalls";
import { Full911Call, FullBolo, FullOfficer, useDispatchState } from "state/dispatchState";
import { ActiveBolos } from "components/active-bolos/ActiveBolos";
import { useTime } from "hooks/useTime";
import { DispatchModalButtons } from "components/dispatch/ModalButtons";
import { UpdateAreaOfPlay } from "components/dispatch/UpdateAOP";
import { useTranslations } from "use-intl";
import { ActiveOfficers } from "components/dispatch/ActiveOfficers";

const NotepadModal = dynamic(async () => {
  return (await import("components/modals/NotepadModal")).NotepadModal;
});
const ActiveOfficersModal = dynamic(async () => {
  return (await import("components/leo/modals/ActiveOfficers")).ActiveOfficersModal;
});

const WeaponSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/WeaponSearchModal")).WeaponSearchModal;
});

const VehicleSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/VehicleSearchModal")).VehicleSearchModal;
});

interface Props {
  calls: Full911Call[];
  bolos: FullBolo[];
  officers: FullOfficer[];
}

export default function OfficerDashboard({ bolos, calls, officers }: Props) {
  const { showAop, areaOfPlay } = useAreaOfPlay();
  const { setCalls, setBolos, setAllOfficers } = useDispatchState();
  const timeRef = useTime();
  const t = useTranslations("Leo");

  React.useEffect(() => {
    setCalls(calls);
    setBolos(bolos);
    setAllOfficers(officers);
  }, [setBolos, setCalls, setAllOfficers, bolos, calls, officers]);

  return (
    <Layout className="max-w-[100rem]">
      <Head>
        <title>{t("dispatch")} - SnailyCAD</title>
      </Head>

      <div className="w-full bg-gray-200/80 rounded-md overflow-hidden">
        <header className="flex items-center justify-between px-4 py-2 bg-gray-300">
          <h3 className="text-xl font-semibold">
            {t("utilityPanel")}
            {showAop ? <span> - AOP: {areaOfPlay}</span> : null}
          </h3>

          <span ref={timeRef} />
        </header>

        <div className="p-3 pb-4">
          <DispatchModalButtons />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-3 mt-3">
        <div className="w-full">
          <ActiveOfficers />
        </div>

        <div className="w-full md:w-96 mt-3 md:mt-0">
          <UpdateAreaOfPlay />
        </div>
      </div>

      <div className="mt-3">
        <ActiveCalls />
        <ActiveBolos />
      </div>

      <NotepadModal />
      <ActiveOfficersModal />
      <WeaponSearchModal />
      <VehicleSearchModal />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const paths = [
    "/admin/values/codes_10?paths=penal_code",
    "/911-calls",
    "/bolos",
    "/dispatch",
  ] as const;

  const handle = async (path: string) =>
    handleRequest(path, {
      headers: req.headers,
      req,
    })
      .then((v) => v.data)
      .catch(() => ({ data: [] }));

  const [values, calls, bolos, officers] = await Promise.all(paths.map(handle));

  return {
    props: {
      session: await getSessionUser(req.headers),
      calls,
      bolos,
      values,
      officers,
      messages: {
        ...(await getTranslations(["citizen", "leo", "calls", "common"], locale)),
      },
    },
  };
};
