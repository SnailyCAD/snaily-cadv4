import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { StatusesArea } from "components/shared/StatusesArea";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { ActiveOfficer, useLeoState } from "state/leoState";
import { Bolo, LeoIncident, Officer, Record, RecordType } from "@snailycad/types";
import { ActiveCalls } from "components/leo/ActiveCalls";
import { Full911Call, useDispatchState } from "state/dispatchState";
import { ModalButtons } from "components/leo/ModalButtons";
import { ActiveBolos } from "components/active-bolos/ActiveBolos";
import { requestAll } from "lib/utils";
import { ActiveOfficers } from "components/dispatch/ActiveOfficers";
import { ActiveDeputies } from "components/dispatch/ActiveDeputies";
import { useSignal100 } from "hooks/shared/useSignal100";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { Title } from "components/shared/Title";
import { UtilityPanel } from "components/shared/UtilityPanel";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Permissions } from "@snailycad/permissions";
import { useNameSearch } from "state/search/nameSearchState";

const NotepadModal = dynamic(async () => {
  return (await import("components/shared/NotepadModal")).NotepadModal;
});

const SelectOfficerModal = dynamic(async () => {
  return (await import("components/leo/modals/SelectOfficerModal")).SelectOfficerModal;
});

const CreateTicketModal = dynamic(async () => {
  return (await import("components/leo/modals/ManageRecordModal")).ManageRecordModal;
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

const CustomFieldSearch = dynamic(async () => {
  return (await import("components/leo/modals/CustomFieldSearch/CustomFieldSearch"))
    .CustomFieldSearch;
});

interface Props {
  officers: Officer[];
  activeOfficer: ActiveOfficer | null;
  calls: Full911Call[];
  bolos: Bolo[];
  activeIncidents: LeoIncident[];
  allOfficers: Officer[];
}

export default function OfficerDashboard({
  officers,
  bolos,
  calls,
  activeOfficer,
  activeIncidents,
  allOfficers,
}: Props) {
  const state = useLeoState();
  const dispatchState = useDispatchState();
  const t = useTranslations("Leo");
  const { signal100Enabled, Component, audio: signal100Audio } = useSignal100();
  const { unit, audio, PanicButton } = usePanicButton();
  const { isOpen } = useModal();

  const { currentResult, setCurrentResult } = useNameSearch();

  function handleRecordCreate(data: Record) {
    if (!currentResult) return;

    setCurrentResult({
      ...currentResult,
      Record: [data, ...currentResult.Record],
    });
  }

  React.useEffect(() => {
    state.setActiveOfficer(activeOfficer);
    state.setOfficers(officers);
    dispatchState.setActiveIncidents(activeIncidents);
    dispatchState.setAllOfficers(allOfficers);

    dispatchState.setCalls(calls);
    dispatchState.setBolos(bolos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bolos, calls, officers, activeOfficer]);

  return (
    <Layout
      permissions={{ fallback: (u) => u.isLeo, permissions: [Permissions.Leo] }}
      className="dark:text-white"
    >
      <Title renderLayoutTitle={false}>{t("officer")}</Title>

      <Component enabled={signal100Enabled} audio={signal100Audio} />
      <PanicButton audio={audio} unit={unit} />

      <UtilityPanel>
        <div className="px-4">
          <ModalButtons />
        </div>

        <StatusesArea
          setUnits={dispatchState.setActiveOfficers}
          units={dispatchState.activeOfficers}
          activeUnit={state.activeOfficer}
          setActiveUnit={state.setActiveOfficer}
        />
      </UtilityPanel>

      <ActiveCalls />
      <ActiveBolos />

      <div className="mt-3">
        <ActiveOfficers />
        <ActiveDeputies />
      </div>

      <SelectOfficerModal />
      <NotepadModal />
      {/* name search have their own vehicle/weapon search modal */}
      {isOpen(ModalIds.NameSearch) ? null : (
        <>
          <WeaponSearchModal />
          <VehicleSearchModal id={ModalIds.VehicleSearch} />
        </>
      )}
      <NameSearchModal />
      <CreateWarrantModal />
      <CustomFieldSearch />

      <div>
        <CreateTicketModal onCreate={handleRecordCreate} type={RecordType.TICKET} />
        <CreateTicketModal onCreate={handleRecordCreate} type={RecordType.ARREST_REPORT} />
        <CreateTicketModal onCreate={handleRecordCreate} type={RecordType.WRITTEN_WARNING} />
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [
    { officers },
    activeOfficer,
    values,
    calls,
    bolos,
    { officers: allOfficers, activeIncidents },
  ] = await requestAll(req, [
    ["/leo", { officers: [] }],
    ["/leo/active-officer", null],
    [
      "/admin/values/codes_10?paths=penal_code,impound_lot,license,driverslicense_category,vehicle_flag,citizen_flag",
      [],
    ],
    ["/911-calls", []],
    ["/bolos", []],
    ["/dispatch", { officers: [], activeIncidents: [] }],
  ]);

  return {
    props: {
      session: await getSessionUser(req),
      allOfficers,
      activeOfficer,
      officers,
      calls,
      bolos,
      values,
      activeIncidents,
      messages: {
        ...(await getTranslations(
          ["citizen", "leo", "truck-logs", "ems-fd", "calls", "common"],
          locale,
        )),
      },
    },
  };
};
