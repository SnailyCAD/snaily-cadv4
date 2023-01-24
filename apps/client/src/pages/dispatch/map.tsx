import dynamic from "next/dynamic";
import Head from "next/head";
import * as React from "react";
import { Layout } from "components/Layout";
import { useAuth } from "context/AuthContext";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import type { DispatchPageProps } from ".";
import { ValueType } from "@snailycad/types";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { useCall911State } from "state/dispatch/call-911-state";

const Map = dynamic(async () => (await import("components/dispatch/map/Map")).Map, {
  ssr: false,
  loading: () => <p>loading map..</p>,
});

type Props = Pick<DispatchPageProps, "bolos" | "calls" | "activeDeputies" | "activeOfficers">;

export default function MapPage(props: Props) {
  useLoadValuesClientSide({
    valueTypes: [
      ValueType.CALL_TYPE,
      ValueType.PENAL_CODE,
      ValueType.DEPARTMENT,
      ValueType.DIVISION,
    ],
  });

  const { cad, user } = useAuth();
  const state = useDispatchState();
  const set911Calls = useCall911State((state) => state.setCalls);

  React.useEffect(() => {
    set911Calls(props.calls.calls);
    state.setBolos(props.bolos.bolos);

    state.setActiveDeputies(props.activeDeputies);
    state.setActiveOfficers(props.activeOfficers);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

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
  const [values, calls, bolos, activeOfficers, activeDeputies] = await requestAll(req, [
    ["/admin/values/codes_10", []],
    ["/911-calls", { calls: [], totalCount: 0 }],
    ["/bolos", { bolos: [], totalCount: 0 }],
    ["/leo/active-officers", []],
    ["/ems-fd/active-deputies", []],
  ]);

  return {
    props: {
      session: user,
      calls,
      bolos,
      values,
      activeOfficers,
      activeDeputies,
      messages: {
        ...(await getTranslations(
          ["citizen", "ems-fd", "leo", "calls", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
