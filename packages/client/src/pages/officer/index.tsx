import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import Head from "next/head";
import { Layout } from "components/Layout";
import { StatusesArea } from "components/shared/StatusesArea";
import { useAreaOfPlay } from "hooks/useAreaOfPlay";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { ActiveOfficer, useLeoState } from "state/leoState";
import { RecordType } from "types/prisma";
import { ActiveCalls } from "components/leo/ActiveCalls";
import { Full911Call, FullBolo, FullOfficer, useDispatchState } from "state/dispatchState";
import { ModalButtons } from "components/leo/ModalButtons";
import { ActiveBolos } from "components/active-bolos/ActiveBolos";
import { useTime } from "hooks/useTime";
import { requestAll } from "lib/utils";
import { ActiveOfficers } from "components/dispatch/ActiveOfficers";
import { ActiveDeputies } from "components/dispatch/ActiveDeputies";
import { useSignal100 } from "hooks/useSignal100";
import { usePanicButton } from "hooks/usePanicButton";

const NotepadModal = dynamic(async () => {
  return (await import("components/modals/NotepadModal")).NotepadModal;
});

const SelectOfficerModal = dynamic(async () => {
  return (await import("components/leo/modals/SelectOfficerModal")).SelectOfficerModal;
});

const CreateTicketModal = dynamic(async () => {
  return (await import("components/leo/modals/CreateTicketModal")).CreateTicketModal;
});

const WeaponSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/WeaponSearchModal")).WeaponSearchModal;
});

const VehicleSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/VehicleSearchModal")).VehicleSearchModal;
});

const NameSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/NameSearchModal/NameSearchModal")).NameSearchModal;
});

const CreateWarrantModal = dynamic(async () => {
  return (await import("components/leo/modals/CreateWarrantModal")).CreateWarrantModal;
});

interface Props {
  officers: FullOfficer[];
  activeOfficer: ActiveOfficer | null;
  calls: Full911Call[];
  bolos: FullBolo[];
}

export default function OfficerDashboard({ officers, bolos, calls, activeOfficer }: Props) {
  const { showAop, areaOfPlay } = useAreaOfPlay();
  const state = useLeoState();
  const { setCalls, setBolos } = useDispatchState();
  const timeRef = useTime();
  const t = useTranslations("Leo");
  const { signal100Enabled, Component } = useSignal100();
  const { unit, PanicButton } = usePanicButton();

  React.useEffect(() => {
    state.setActiveOfficer(activeOfficer);
    state.setOfficers(officers);
    setCalls(calls);
    setBolos(bolos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.setActiveOfficer,
    state.setOfficers,
    setBolos,
    setCalls,
    bolos,
    calls,
    officers,
    activeOfficer,
  ]);

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>{t("officer")} - SnailyCAD</title>
      </Head>

      {signal100Enabled ? <Component /> : null}
      {unit ? <PanicButton unit={unit} /> : null}

      <div className="w-full mb-3 overflow-hidden card">
        <header className="flex items-center justify-between px-4 py-2 mb-2 bg-gray-300 dark:bg-gray-3">
          <h3 className="text-xl font-semibold">
            {t("utilityPanel")}
            {showAop ? <span> - AOP: {areaOfPlay}</span> : null}
          </h3>

          <span ref={timeRef} />
        </header>

        <div className="px-4">
          <ModalButtons />
        </div>

        <StatusesArea activeUnit={state.activeOfficer} setActiveUnit={state.setActiveOfficer} />
      </div>

      <ActiveCalls />
      <ActiveBolos />

      <div className="mt-3">
        <ActiveOfficers />
        <ActiveDeputies />
      </div>

      <SelectOfficerModal />
      <NotepadModal />
      <WeaponSearchModal />
      <VehicleSearchModal />
      <NameSearchModal />
      <CreateWarrantModal />

      <div>
        <CreateTicketModal type={RecordType.TICKET} />
        <CreateTicketModal type={RecordType.ARREST_REPORT} />
        <CreateTicketModal type={RecordType.WRITTEN_WARNING} />
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [{ officers, citizens }, activeOfficer, values, calls, bolos] = await requestAll(req, [
    ["/leo", { officers: [], citizens: [] }],
    ["/leo/active-officer", null],
    ["/admin/values/codes_10?paths=penal_code,impound_lot,license", []],
    ["/911-calls", []],
    ["/bolos", []],
  ]);

  return {
    props: {
      session: await getSessionUser(req),
      activeOfficer,
      officers,
      calls,
      bolos,
      values,
      citizens,
      messages: {
        ...(await getTranslations(["citizen", "leo", "ems-fd", "calls", "common"], locale)),
      },
    },
  };
};
