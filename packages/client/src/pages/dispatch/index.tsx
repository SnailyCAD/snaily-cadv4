import * as React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { Layout } from "components/Layout";
import { useAreaOfPlay } from "hooks/useAreaOfPlay";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { ActiveCalls } from "components/leo/ActiveCalls";
import {
  Full911Call,
  FullBolo,
  FullDeputy,
  FullOfficer,
  useDispatchState,
} from "state/dispatchState";
import { ActiveBolos } from "components/active-bolos/ActiveBolos";
import { useTime } from "hooks/useTime";
import { DispatchModalButtons } from "components/dispatch/ModalButtons";
import { useTranslations } from "use-intl";
import { ActiveOfficers } from "components/dispatch/ActiveOfficers";
import { ActiveDeputies } from "components/dispatch/ActiveDeputies";
import { DispatchAOP } from "components/dispatch/DispatchAOP";
import { requestAll } from "lib/utils";
import { useSignal100 } from "hooks/useSignal100";
import { usePanicButton } from "hooks/usePanicButton";

const NotepadModal = dynamic(async () => {
  return (await import("components/modals/NotepadModal")).NotepadModal;
});

const WeaponSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/WeaponSearchModal")).WeaponSearchModal;
});

const VehicleSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/VehicleSearchModal")).VehicleSearchModal;
});

const AddressSearchModal = dynamic(async () => {
  return (await import("components/dispatch/modals/AddressSearchModal")).AddressSearchModal;
});

const NameSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/NameSearchModal/NameSearchModal")).NameSearchModal;
});

interface Props {
  calls: Full911Call[];
  bolos: FullBolo[];
  officers: FullOfficer[];
  activeDeputies: FullDeputy[];
  activeOfficers: FullOfficer[];
}

export default function OfficerDashboard(props: Props) {
  const { showAop } = useAreaOfPlay();
  const state = useDispatchState();
  const timeRef = useTime();
  const t = useTranslations("Leo");
  const { signal100Enabled, Component } = useSignal100();
  const { unit, PanicButton } = usePanicButton();

  React.useEffect(() => {
    state.setCalls(props.calls);
    state.setBolos(props.bolos);
    state.setAllOfficers(props.officers);
    state.setActiveDeputies(props.activeDeputies);
    state.setActiveOfficers(props.activeOfficers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.setCalls,
    state.setBolos,
    state.setAllOfficers,
    state.setActiveDeputies,
    state.setActiveOfficers,
    props,
  ]);

  return (
    <Layout className="max-w-[100rem]">
      <Head>
        <title>{t("dispatch")} - SnailyCAD</title>
      </Head>

      {signal100Enabled ? <Component /> : null}
      {unit ? <PanicButton unit={unit} /> : null}

      <div className="w-full bg-gray-200/80 rounded-md overflow-hidden">
        <header className="flex items-center justify-between px-4 py-2 bg-gray-300">
          <h3 className="text-xl font-semibold">
            {t("utilityPanel")}
            {showAop ? <DispatchAOP /> : null}
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
          <ActiveDeputies />
        </div>
      </div>

      <div className="mt-3">
        <ActiveCalls />
        <ActiveBolos />
      </div>

      <NotepadModal />
      <WeaponSearchModal />
      <VehicleSearchModal />
      <AddressSearchModal />
      <NameSearchModal />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [values, calls, bolos, officers, activeDeputies, activeOfficers] = await requestAll(req, [
    ["/admin/values/codes_10?paths=penal_code", []],
    ["/911-calls", []],
    ["/bolos", []],
    ["/dispatch", []],
    ["/ems-fd/active-deputies", []],
    ["/leo/active-officers", []],
  ]);

  return {
    props: {
      session: await getSessionUser(req.headers),
      calls,
      bolos,
      values,
      officers,
      activeDeputies,
      activeOfficers,
      messages: {
        ...(await getTranslations(["citizen", "ems-fd", "leo", "calls", "common"], locale)),
      },
    },
  };
};
