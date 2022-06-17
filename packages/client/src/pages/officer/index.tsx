import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { StatusesArea } from "components/shared/StatusesArea";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { ActiveOfficer, useLeoState } from "state/leoState";
import { Bolo, EmsFdDeputy, LeoIncident, Record, RecordType, ValueType } from "@snailycad/types";
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
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTones } from "hooks/global/useTones";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";

const Modals = {
  CreateWarrantModal: dynamic(async () => {
    return (await import("components/leo/modals/CreateWarrantModal")).CreateWarrantModal;
  }),
  CustomFieldSearch: dynamic(async () => {
    return (await import("components/leo/modals/CustomFieldSearch/CustomFieldSearch"))
      .CustomFieldSearch;
  }),
  NameSearchModal: dynamic(async () => {
    return (await import("components/leo/modals/NameSearchModal/NameSearchModal")).NameSearchModal;
  }),
  VehicleSearchModal: dynamic(async () => {
    return (await import("components/leo/modals/VehicleSearchModal")).VehicleSearchModal;
  }),
  WeaponSearchModal: dynamic(async () => {
    return (await import("components/leo/modals/WeaponSearchModal")).WeaponSearchModal;
  }),
  NotepadModal: dynamic(async () => {
    return (await import("components/shared/NotepadModal")).NotepadModal;
  }),
  SelectOfficerModal: dynamic(async () => {
    return (await import("components/leo/modals/SelectOfficerModal")).SelectOfficerModal;
  }),
  CreateTicketModal: dynamic(async () => {
    return (await import("components/leo/modals/ManageRecordModal")).ManageRecordModal;
  }),
  SwitchDivisionCallsignModal: dynamic(async () => {
    return (await import("components/leo/modals/SwitchDivisionCallsignModal"))
      .SwitchDivisionCallsignModal;
  }),
};

interface Props {
  activeOfficer: ActiveOfficer | null;
  calls: Full911Call[];
  bolos: Bolo[];
  activeIncidents: LeoIncident[];

  activeDeputies: EmsFdDeputy[];
  activeOfficers: ActiveOfficer[];
}

export default function OfficerDashboard({
  bolos,
  calls,
  activeOfficer,
  activeIncidents,

  activeOfficers,
  activeDeputies,
}: Props) {
  useLoadValuesClientSide({
    valueTypes: [
      ValueType.CITIZEN_FLAG,
      ValueType.VEHICLE_FLAG,
      ValueType.CALL_TYPE,
      ValueType.LICENSE,
      ValueType.DRIVERSLICENSE_CATEGORY,
      ValueType.IMPOUND_LOT,
      ValueType.PENAL_CODE,
      ValueType.DEPARTMENT,
      ValueType.DIVISION,
    ],
  });

  const leoState = useLeoState();
  const dispatchState = useDispatchState();
  const t = useTranslations("Leo");
  const signal100 = useSignal100();
  const tones = useTones("leo");
  const panic = usePanicButton();
  const { isOpen } = useModal();
  const { LEO_TICKETS } = useFeatureEnabled();

  const { currentResult, setCurrentResult } = useNameSearch();

  function handleRecordCreate(data: Record) {
    if (!currentResult) return;

    setCurrentResult({
      ...currentResult,
      Record: [data, ...currentResult.Record],
    });
  }

  React.useEffect(() => {
    leoState.setActiveOfficer(activeOfficer);

    dispatchState.setCalls(calls);
    dispatchState.setBolos(bolos);

    dispatchState.setActiveIncidents(activeIncidents);

    dispatchState.setActiveDeputies(activeDeputies);
    dispatchState.setActiveOfficers(activeOfficers);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bolos, calls, activeOfficers, activeDeputies, activeOfficer]);

  return (
    <Layout
      permissions={{ fallback: (u) => u.isLeo, permissions: [Permissions.Leo] }}
      className="dark:text-white"
    >
      <Title renderLayoutTitle={false}>{t("officer")}</Title>

      <signal100.Component enabled={signal100.enabled} audio={signal100.audio} />
      <panic.Component audio={panic.audio} unit={panic.unit} />
      <tones.Component audio={tones.audio} description={tones.description} />

      <UtilityPanel>
        <div className="px-4">
          <ModalButtons />
        </div>

        <StatusesArea
          setUnits={dispatchState.setActiveOfficers}
          units={dispatchState.activeOfficers}
          activeUnit={leoState.activeOfficer}
          setActiveUnit={leoState.setActiveOfficer}
        />
      </UtilityPanel>

      <ActiveCalls />
      <ActiveBolos />

      <div className="mt-3">
        <ActiveOfficers />
        <ActiveDeputies />
      </div>

      <Modals.SelectOfficerModal />

      {leoState.activeOfficer ? (
        <>
          <Modals.SwitchDivisionCallsignModal />
          <Modals.NotepadModal />
          {/* name search have their own vehicle/weapon search modal */}
          {isOpen(ModalIds.NameSearch) ? null : (
            <>
              <Modals.WeaponSearchModal />
              <Modals.VehicleSearchModal id={ModalIds.VehicleSearch} />
            </>
          )}
          <Modals.NameSearchModal />
          <Modals.CreateWarrantModal />
          <Modals.CustomFieldSearch />
        </>
      ) : null}

      <div>
        {LEO_TICKETS ? (
          <Modals.CreateTicketModal onCreate={handleRecordCreate} type={RecordType.TICKET} />
        ) : null}
        <Modals.CreateTicketModal onCreate={handleRecordCreate} type={RecordType.ARREST_REPORT} />
        <Modals.CreateTicketModal onCreate={handleRecordCreate} type={RecordType.WRITTEN_WARNING} />
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const [activeOfficer, values, calls, bolos, activeOfficers, activeDeputies] = await requestAll(
    req,
    [
      ["/leo/active-officer", null],
      ["/admin/values/codes_10", []],
      ["/911-calls", []],
      ["/bolos", []],
      ["/leo/active-officers", []],
      ["/ems-fd/active-deputies", []],
    ],
  );

  return {
    props: {
      // todo:
      activeIncidents: [],
      session: await getSessionUser(req),
      activeOfficers,
      activeDeputies,
      activeOfficer,
      calls,
      bolos,
      values,
      messages: {
        ...(await getTranslations(
          ["citizen", "leo", "truck-logs", "ems-fd", "calls", "common"],
          locale,
        )),
      },
    },
  };
};
