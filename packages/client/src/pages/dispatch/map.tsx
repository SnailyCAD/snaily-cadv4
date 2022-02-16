import dynamic from "next/dynamic";
import Head from "next/head";
import * as React from "react";
import { Layout } from "components/Layout";
import { useAuth } from "context/AuthContext";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useDispatchState } from "state/dispatchState";
import { Title } from "components/shared/Title";

const Map = dynamic(async () => (await import("components/dispatch/map/Map_New")).Map, {
  ssr: false,
  loading: () => <p>loading map..</p>,
});

export default function MapPage(props: any) {
  const { cad, user } = useAuth();
  const state = useDispatchState();

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
      </Head>
      <Title>Dispatch Live Map</Title>

      <Layout navMaxWidth="none" className="relative px-1 pb-1 mt-1 !max-w-none">
        <Map />
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
