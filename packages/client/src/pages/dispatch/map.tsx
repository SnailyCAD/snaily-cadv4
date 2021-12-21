import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";

const Map = dynamic(async () => (await import("components/dispatch/map/Map")).Map, {
  ssr: false,
  loading: () => <p>loading map..</p>,
});

export default function MapPage() {
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
      ["/dispatch", [{ deputies: [], officers: [] }]],
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
