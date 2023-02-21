import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { StatusesArea } from "components/shared/StatusesArea";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useLeoState } from "state/leo-state";
import { ActiveToneType, Rank, Record, RecordType, ValueType } from "@snailycad/types";
import { ActiveCalls } from "components/dispatch/active-calls/active-calls";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { ModalButtons } from "components/leo/ModalButtons";
import { ActiveBolos } from "components/active-bolos/active-bolos";
import { requestAll } from "lib/utils";
import { ActiveOfficers } from "components/dispatch/active-officers";
import { ActiveDeputies } from "components/dispatch/active-deputies";
import { ActiveWarrants } from "components/leo/active-warrants/ActiveWarrants";
import { useSignal100 } from "hooks/shared/useSignal100";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { Title } from "components/shared/Title";
import { UtilityPanel } from "components/shared/UtilityPanel";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { useNameSearch } from "state/search/name-search-state";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTones } from "hooks/global/use-tones";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import type {
  Get911CallsData,
  GetActiveOfficerData,
  GetActiveOfficersData,
  GetBolosData,
  GetEmsFdActiveDeputies,
} from "@snailycad/types/api";
import { CreateWarrantModal } from "components/leo/modals/CreateWarrantModal";
import { useCall911State } from "state/dispatch/call-911-state";
import { usePermission } from "hooks/usePermission";
import { shallow } from "zustand/shallow";

const Modals = {
  CreateWarrantModal: dynamic(
    async () => {
      return (await import("components/leo/modals/CreateWarrantModal")).CreateWarrantModal;
    },
    { ssr: false },
  ),
  CustomFieldSearch: dynamic(
    async () => {
      return (await import("components/leo/modals/CustomFieldSearch/CustomFieldSearch"))
        .CustomFieldSearch;
    },
    { ssr: false },
  ),
  NameSearchModal: dynamic(
    async () => {
      return (await import("components/leo/modals/NameSearchModal/NameSearchModal"))
        .NameSearchModal;
    },
    { ssr: false },
  ),
  VehicleSearchModal: dynamic(
    async () => {
      return (await import("components/leo/modals/VehicleSearchModal")).VehicleSearchModal;
    },
    { ssr: false },
  ),
  WeaponSearchModal: dynamic(
    async () => {
      return (await import("components/leo/modals/weapon-search-modal")).WeaponSearchModal;
    },
    { ssr: false },
  ),
  BusinessSearchModal: dynamic(
    async () => {
      return (await import("components/leo/modals/business-search-modal/business-search-modal"))
        .BusinessSearchModal;
    },
    { ssr: false },
  ),
  NotepadModal: dynamic(
    async () => {
      return (await import("components/shared/NotepadModal")).NotepadModal;
    },
    { ssr: false },
  ),
  SelectOfficerModal: dynamic(
    async () => {
      return (await import("components/leo/modals/select-officer-modal")).SelectOfficerModal;
    },
    { ssr: false },
  ),
  ManageRecordModal: dynamic(
    async () => {
      return (await import("components/leo/modals/manage-record/manage-record-modal"))
        .ManageRecordModal;
    },
    { ssr: false },
  ),
  SwitchDivisionCallsignModal: dynamic(async () => {
    return (await import("components/leo/modals/SwitchDivisionCallsignModal"))
      .SwitchDivisionCallsignModal;
  }),
};

interface Props {
  activeOfficer: GetActiveOfficerData;
  activeOfficers: GetActiveOfficersData;
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
  const set911Calls = useCall911State((state) => state.setCalls);
  const t = useTranslations("Leo");
  const signal100 = useSignal100();
  const tones = useTones(ActiveToneType.LEO);
  const panic = usePanicButton();
  const { isOpen } = useModal();
  const { LEO_TICKETS, ACTIVE_WARRANTS, CALLS_911 } = useFeatureEnabled();
  const { hasPermissions } = usePermission();
  const isAdmin = hasPermissions(
    defaultPermissions.allDefaultAdminPermissions,
    (u) => u.rank !== Rank.USER,
  );

  const { currentResult, setCurrentResult } = useNameSearch(
    (state) => ({
      currentResult: state.currentResult,
      setCurrentResult: state.setCurrentResult,
    }),
    shallow,
  );

  function handleRecordCreate(data: Record) {
    if (!currentResult || currentResult.isConfidential) return;

    setCurrentResult({
      ...currentResult,
      Record: [data, ...currentResult.Record],
    });
  }

  React.useEffect(() => {
    leoState.setActiveOfficer(activeOfficer);

    set911Calls(calls.calls);
    dispatchState.setBolos(bolos.bolos);

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
      <tones.Component audio={tones.audio} description={tones.description} user={tones.user} />

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

      {CALLS_911 ? <ActiveCalls initialData={calls} /> : null}
      <ActiveBolos initialBolos={bolos} />
      {ACTIVE_WARRANTS ? <ActiveWarrants /> : null}
      <div className="mt-3">
        <ActiveOfficers initialOfficers={activeOfficers} />
        <ActiveDeputies initialDeputies={activeDeputies} />
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
              <Modals.BusinessSearchModal />

              {LEO_TICKETS ? (
                <Modals.ManageRecordModal onCreate={handleRecordCreate} type={RecordType.TICKET} />
              ) : null}
              <Modals.ManageRecordModal
                onCreate={handleRecordCreate}
                type={RecordType.ARREST_REPORT}
              />
              <Modals.ManageRecordModal
                onCreate={handleRecordCreate}
                type={RecordType.WRITTEN_WARNING}
              />
            </>
          )}
          <Modals.NameSearchModal />
          {!ACTIVE_WARRANTS ? <CreateWarrantModal warrant={null} /> : null}
          <Modals.CustomFieldSearch />
        </>
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [activeOfficer, values, calls, bolos, activeOfficers, activeDeputies] = await requestAll(
    req,
    [
      ["/leo/active-officer", null],
      ["/admin/values/codes_10", []],
      ["/911-calls", { calls: [], totalCount: 0 }],
      ["/bolos", { bolos: [], totalCount: 0 }],
      ["/leo/active-officers", []],
      ["/ems-fd/active-deputies", []],
    ],
  );

  return {
    props: {
      session: user,
      activeOfficers,
      activeDeputies,
      activeOfficer,
      calls,
      bolos,
      values,
      messages: {
        ...(await getTranslations(
          ["citizen", "leo", "truck-logs", "ems-fd", "calls", "common", "business", "courthouse"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
