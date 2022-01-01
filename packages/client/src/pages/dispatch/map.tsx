import dynamic from "next/dynamic";
import Head from "next/head";
import * as React from "react";
import { Layout } from "components/Layout";
import { useAuth } from "context/AuthContext";
import { useModal } from "context/ModalContext";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { Full911Call, useDispatchState } from "state/dispatchState";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";

const Map = dynamic(async () => (await import("components/dispatch/map/Map")).Map, {
  ssr: false,
  loading: () => <p>loading map..</p>,
});

export default function MapPage(props: any) {
  const { openModal } = useModal();
  const { cad, user } = useAuth();
  const state = useDispatchState();
  const { execute } = useFetch();
  const t = useTranslations();

  async function update911Call(call: Omit<Full911Call, "events" | "assignedUnits">) {
    await execute(`/911-calls/${call.id}`, { method: "PUT", data: call });
  }

  React.useEffect(() => {
    state.setCalls(props.calls);
    state.setBolos(props.bolos);
    state.setAllOfficers(props.officers);
    state.setActiveDeputies(props.activeDeputies);
    state.setActiveOfficers(props.activeOfficers);
    state.setAllDeputies(props.deputies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.setCalls,
    state.setBolos,
    state.setAllOfficers,
    state.setActiveDeputies,
    state.setActiveOfficers,
    state.setAllDeputies,
    props,
  ]);

  if (!user || !cad) {
    return null;
  }

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
          integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
          crossOrigin=""
        />
        <title>Map / Dispatch - SnailyCAD</title>
        {/* disabled since I can't use css modules for this & I don't want to load unneeded css via _app.tsx */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        {/* <link rel="stylesheet" href="/css/map.css" /> */}
      </Head>

      <Layout className="relative px-1 pb-1 mt-1">
        <Map
          cad={cad}
          update911Call={update911Call}
          calls={state.calls}
          openModal={openModal}
          user={user}
          t={t}
        />
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [values, calls, bolos, { officers, deputies }, activeDeputies, activeOfficers] =
    await requestAll(req, [
      ["/admin/values/codes_10?paths=penal_code,impound_lot", []],
      ["/911-calls", []],
      ["/bolos", []],
      ["/dispatch", { deputies: [], officers: [] }],
      ["/ems-fd/active-deputies", []],
      ["/leo/active-officers", []],
    ]);

  return {
    props: {
      session: await getSessionUser(req),
      calls,
      bolos,
      values,
      officers,
      deputies,
      activeDeputies,
      activeOfficers,
      messages: {
        ...(await getTranslations(["citizen", "ems-fd", "leo", "calls", "common"], locale)),
      },
    },
  };
};
