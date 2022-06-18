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
import { Permissions } from "@snailycad/permissions";
import type { DispatchPageProps } from ".";
import { CombinedLeoUnit, EmsFdDeputy, Officer, ShouldDoType } from "@snailycad/types";

const Map = dynamic(async () => (await import("components/dispatch/map/Map")).Map, {
  ssr: false,
  loading: () => <p>loading map..</p>,
});

type Props = Pick<DispatchPageProps, "bolos" | "calls" | "deputies" | "officers">;

export default function MapPage(props: Props) {
  const { cad, user } = useAuth();
  const state = useDispatchState();

  React.useEffect(() => {
    state.setCalls(props.calls);
    state.setBolos(props.bolos);
    state.setAllOfficers(props.officers);
    state.setAllDeputies(props.deputies);

    function activeFilter(v: EmsFdDeputy | Officer | CombinedLeoUnit) {
      return Boolean(v.statusId && v.status?.shouldDo !== ShouldDoType.SET_OFF_DUTY);
    }

    const activeOfficers = [...props.officers].filter(activeFilter);
    const activeDeputies = [...props.deputies].filter(activeFilter);

    state.setActiveDeputies(activeDeputies);
    state.setActiveOfficers(activeOfficers);

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
      <Title renderLayoutTitle={false}>Dispatch Live Map</Title>

      <Layout
        permissions={{ fallback: (u) => u.isDispatch, permissions: [Permissions.LiveMap] }}
        navMaxWidth="none"
        className="relative !px-0 !pb-0 !mt-0 !max-w-none"
      >
        <Map />
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [values, calls, bolos, { officers, deputies }] = await requestAll(req, [
    ["/admin/values/codes_10?paths=penal_code,impound_lot,department,division", []],
    ["/911-calls", []],
    ["/bolos", []],
    ["/dispatch", { deputies: [], officers: [] }],
  ]);

  return {
    props: {
      session: user,
      calls,
      bolos,
      values,
      officers,
      deputies,
      messages: {
        ...(await getTranslations(
          ["citizen", "ems-fd", "leo", "calls", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
