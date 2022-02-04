import * as React from "react";
import dynamic from "next/dynamic";
import { Layout } from "components/Layout";
import { useAreaOfPlay } from "hooks/global/useAreaOfPlay";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { ActiveCalls } from "components/leo/ActiveCalls";
import {
  Full911Call,
  FullBolo,
  FullDeputy,
  FullOfficer,
  useDispatchState,
} from "state/dispatchState";
import { ActiveBolos } from "components/active-bolos/ActiveBolos";
import { useTime } from "hooks/shared/useTime";
import { DispatchModalButtons } from "components/dispatch/ModalButtons";
import { useTranslations } from "use-intl";
import { ActiveOfficers } from "components/dispatch/ActiveOfficers";
import { ActiveDeputies } from "components/dispatch/ActiveDeputies";
import { DispatchAOP } from "components/dispatch/DispatchAOP";
import { requestAll } from "lib/utils";
import { useSignal100 } from "hooks/shared/useSignal100";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { Title } from "components/shared/Title";
import type { ActiveDispatchers } from "@snailycad/types";

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
  deputies: FullDeputy[];
  activeDeputies: FullDeputy[];
  activeOfficers: FullOfficer[];
  activeDispatchers: ActiveDispatchers[];
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
    state.setAllDeputies(props.deputies);
    state.setActiveDispatchers(props.activeDispatchers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.setCalls,
    state.setBolos,
    state.setAllOfficers,
    state.setActiveDeputies,
    state.setActiveOfficers,
    state.setAllDeputies,
    state.setActiveDispatchers,
    props,
  ]);

  return (
    <Layout className="dark:text-white">
      <Title>{t("dispatch")}</Title>

      {signal100Enabled ? <Component /> : null}
      {unit ? <PanicButton unit={unit} /> : null}

      <div className="w-full overflow-hidden rounded-md bg-gray-200/80 dark:bg-gray-2">
        <header className="flex items-center justify-between px-4 py-2 bg-gray-300 dark:bg-gray-3">
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

      <div className="flex flex-col mt-3 md:flex-row md:space-x-3">
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
  const [
    values,
    calls,
    bolos,
    { officers, deputies, activeDispatchers },
    activeDeputies,
    activeOfficers,
  ] = await requestAll(req, [
    ["/admin/values/codes_10?paths=penal_code,impound_lot,license,department,division", []],
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
      activeDispatchers,
      messages: {
        ...(await getTranslations(
          ["citizen", "truck-logs", "ems-fd", "leo", "calls", "common"],
          locale,
        )),
      },
    },
  };
};
