import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { StatusesArea } from "components/shared/StatusesArea";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useLeoState } from "state/leoState";
import { Rank, Record, RecordType, ValueType } from "@snailycad/types";
import { ActiveCalls } from "components/dispatch/active-calls/ActiveCalls";
import { useDispatchState } from "state/dispatch/dispatchState";
import { ModalButtons } from "components/leo/ModalButtons";
import { ActiveBolos } from "components/active-bolos/ActiveBolos";
import { requestAll } from "lib/utils";
import { ActiveOfficers } from "components/dispatch/ActiveOfficers";
import { ActiveDeputies } from "components/dispatch/ActiveDeputies";
import { ActiveWarrants } from "components/leo/active-warrants/ActiveWarrants";
import { useSignal100 } from "hooks/shared/useSignal100";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { Title } from "components/shared/Title";
import { UtilityPanel } from "components/shared/UtilityPanel";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { useNameSearch } from "state/search/nameSearchState";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTones } from "hooks/global/useTones";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import type {
  Get911CallsData,
  GetActiveOfficerData,
  GetActiveOfficersData,
  GetBolosData,
  GetEmsFdActiveDeputies,
  GetMyOfficersData,
} from "@snailycad/types/api";
import { CreateWarrantModal } from "components/leo/modals/CreateWarrantModal";
import { useCall911State } from "state/dispatch/call911State";
import { DndProvider } from "components/shared/dnd/DndProvider";
import { usePermission } from "hooks/usePermission";

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
  ManageRecordModal: dynamic(async () => {
    return (await import("components/leo/modals/ManageRecordModal")).ManageRecordModal;
  }),
  SwitchDivisionCallsignModal: dynamic(async () => {
    return (await import("components/leo/modals/SwitchDivisionCallsignModal"))
      .SwitchDivisionCallsignModal;
  }),
};

interface Props {
  activeOfficer: GetActiveOfficerData;
  activeOfficers: GetActiveOfficersData;
  userOfficers: GetMyOfficersData["officers"];
  calls: Get911CallsData;
  bolos: GetBolosData;
  activeDeputies: GetEmsFdActiveDeputies;
}

export default function OfficerDashboard({
  bolos,
  calls,
  activeOfficer,
  activeOfficers,
  activeDeputies,
  userOfficers,
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
  const call911State = useCall911State();
  const t = useTranslations("Leo");
  const signal100 = useSignal100();
  const tones = useTones("leo");
  const panic = usePanicButton();
  const { isOpen } = useModal();
  const { LEO_TICKETS, ACTIVE_WARRANTS, CALLS_911 } = useFeatureEnabled();
  const { hasPermissions } = usePermission();
  const isAdmin = hasPermissions(
    defaultPermissions.allDefaultAdminPermissions,
    (u) => u.rank !== Rank.USER,
  );

  const { currentResult, setCurrentResult } = useNameSearch();

  function handleRecordCreate(data: Record) {
    if (!currentResult || currentResult.isConfidential) return;

    setCurrentResult({
      ...currentResult,
      Record: [data, ...currentResult.Record],
    });
  }

  React.useEffect(() => {
    leoState.setActiveOfficer(activeOfficer);

    call911State.setCalls(calls.calls);
    dispatchState.setBolos(bolos);

    dispatchState.setActiveDeputies(activeDeputies);
    dispatchState.setActiveOfficers(activeOfficers);
    leoState.setUserOfficers(userOfficers);

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
      <tones.Component {...tones} />

      <UtilityPanel>
        <div className="px-4">
          <ModalButtons initialActiveOfficer={activeOfficer} />
        </div>

        <StatusesArea
          setUnits={dispatchState.setActiveOfficers}
          units={dispatchState.activeOfficers}
          activeUnit={leoState.activeOfficer}
          setActiveUnit={leoState.setActiveOfficer}
          initialData={activeOfficer}
        />
      </UtilityPanel>

      <div id="officer">
        <DndProvider id="officer">
          {CALLS_911 ? <ActiveCalls initialData={calls} /> : null}
          <ActiveBolos initialBolos={bolos} />
          {ACTIVE_WARRANTS ? <ActiveWarrants /> : null}
          <div className="mt-3">
            <ActiveOfficers initialOfficers={activeOfficers} />
            <ActiveDeputies initialDeputies={activeDeputies} />
          </div>
        </DndProvider>
      </div>

      <Modals.SelectOfficerModal />

      {isAdmin || leoState.activeOfficer ? (
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
          {!ACTIVE_WARRANTS ? <CreateWarrantModal warrant={null} /> : null}
          <Modals.CustomFieldSearch />

          {LEO_TICKETS ? (
            <Modals.ManageRecordModal onCreate={handleRecordCreate} type={RecordType.TICKET} />
          ) : null}
          <Modals.ManageRecordModal onCreate={handleRecordCreate} type={RecordType.ARREST_REPORT} />
          <Modals.ManageRecordModal
            onCreate={handleRecordCreate}
            type={RecordType.WRITTEN_WARNING}
          />
        </>
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [
    activeOfficer,
    { officers: userOfficers },
    values,
    calls,
    bolos,
    activeOfficers,
    activeDeputies,
  ] = await requestAll(req, [
    ["/leo/active-officer", null],
    ["/leo", { officers: [] }],
    ["/admin/values/codes_10", []],
    ["/911-calls", { calls: [], totalCount: 0 }],
    ["/bolos", []],
    ["/leo/active-officers", []],
    ["/ems-fd/active-deputies", []],
  ]);

  return {
    props: {
      session: user,
      activeOfficers,
      activeDeputies,
      activeOfficer,
      userOfficers,
      calls,
      bolos,
      values,
      messages: {
        ...(await getTranslations(
          ["citizen", "leo", "truck-logs", "ems-fd", "calls", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
