import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { StatusesArea } from "components/shared/utility-panel/statuses-area";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useLeoState } from "state/leo-state";
import {
  ActiveToneType,
  DashboardLayoutCardType,
  type Record,
  RecordType,
  ValueType,
} from "@snailycad/types";
import { ActiveCalls } from "components/dispatch/active-calls/active-calls";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { ModalButtons } from "components/leo/ModalButtons";
import { ActiveBolos } from "components/active-bolos/active-bolos";
import { requestAll } from "lib/utils";
import { ActiveOfficers } from "components/dispatch/active-units/officers/active-officers";
import { ActiveDeputies } from "components/dispatch/active-units/deputies/active-deputies";
import { ActiveWarrants } from "components/leo/active-warrants/active-warrants";
import { useSignal100 } from "hooks/shared/useSignal100";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { Title } from "components/shared/Title";
import { UtilityPanel } from "components/shared/utility-panel/utility-panel";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
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
  GetUserData,
} from "@snailycad/types/api";
import { CreateWarrantModal } from "components/leo/modals/CreateWarrantModal";
import { useCall911State } from "state/dispatch/call-911-state";
import { usePermission } from "hooks/usePermission";
import { useAuth } from "context/AuthContext";
import { ActiveIncidents } from "components/dispatch/active-incidents/active-incidents";

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
  DepartmentInfoModal: dynamic(async () => {
    return (await import("components/leo/modals/department-info-modal")).DepartmentInformationModal;
  }),
};

interface Props {
  activeOfficer: GetActiveOfficerData;
  activeOfficers: GetActiveOfficersData;
  calls: Get911CallsData;
  bolos: GetBolosData;
  activeDeputies: GetEmsFdActiveDeputies;
  session: GetUserData | null;
}

export default function OfficerDashboard({
  bolos,
  calls,
  activeOfficer,
  activeOfficers,
  activeDeputies,
  session: _session,
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
      ValueType.WEAPON_FLAG,
    ],
  });

  const setActiveOfficer = useLeoState((state) => state.setActiveOfficer);
  const dispatchState = useDispatchState((state) => ({
    setBolos: state.setBolos,
    setActiveOfficers: state.setActiveOfficers,
    setActiveDeputies: state.setActiveDeputies,
  }));
  const set911Calls = useCall911State((state) => state.setCalls);
  const t = useTranslations("Leo");
  const { ACTIVE_INCIDENTS, ACTIVE_WARRANTS, CALLS_911 } = useFeatureEnabled();
  const { user } = useAuth();
  const session = user ?? _session;

  React.useEffect(() => {
    setActiveOfficer(activeOfficer);

    set911Calls(calls.calls);
    dispatchState.setBolos(bolos.bolos);

    dispatchState.setActiveDeputies(activeDeputies);
    dispatchState.setActiveOfficers(activeOfficers);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bolos, calls, activeOfficers, activeDeputies, activeOfficer]);

  const cards = [
    {
      type: DashboardLayoutCardType.ACTIVE_OFFICERS,
      isEnabled: true,
      children: <ActiveOfficers initialOfficers={activeOfficers} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_DEPUTIES,
      isEnabled: true,
      children: <ActiveDeputies initialDeputies={activeDeputies} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_CALLS,
      isEnabled: CALLS_911,
      children: <ActiveCalls initialData={calls} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_WARRANTS,
      isEnabled: ACTIVE_WARRANTS,
      children: <ActiveWarrants />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_BOLOS,
      isEnabled: true,
      children: <ActiveBolos initialBolos={bolos} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_INCIDENTS,
      isEnabled: ACTIVE_INCIDENTS,
      children: <ActiveIncidents />,
    },
  ];

  const layoutOrder = session?.officerLayoutOrder ?? [];
  const sortedCards = cards.sort((a, b) => {
    return layoutOrder.indexOf(a.type) - layoutOrder.indexOf(b.type);
  });

  return (
    <Layout permissions={{ permissions: [Permissions.Leo] }} className="dark:text-white">
      <Title renderLayoutTitle={false}>{t("officer")}</Title>

      <OfficerHeader activeOfficer={activeOfficer} />

      {sortedCards.map((card) =>
        card.isEnabled ? <React.Fragment key={card.type}>{card.children}</React.Fragment> : null,
      )}

      <Modals.SelectOfficerModal />
      <OfficerModals />
    </Layout>
  );
}

function OfficerHeader(props: Pick<Props, "activeOfficer">) {
  const signal100 = useSignal100();
  const tones = useTones(ActiveToneType.LEO);
  const panic = usePanicButton();

  const leoState = useLeoState();
  const dispatchState = useDispatchState((state) => ({
    activeOfficers: state.activeOfficers,
    setActiveOfficers: state.setActiveOfficers,
  }));

  return (
    <>
      <signal100.Component enabled={signal100.enabled} audio={signal100.audio} />
      <panic.Component audio={panic.audio} unit={panic.unit} />
      <tones.Component audio={tones.audio} description={tones.description} user={tones.user} />

      <UtilityPanel>
        <div className="px-4">
          <ModalButtons initialActiveOfficer={props.activeOfficer} />
        </div>

        <StatusesArea
          setUnits={dispatchState.setActiveOfficers}
          units={dispatchState.activeOfficers}
          activeUnit={leoState.activeOfficer}
          setActiveUnit={leoState.setActiveOfficer}
          initialData={props.activeOfficer}
        />
      </UtilityPanel>
    </>
  );
}

function OfficerModals() {
  const leoState = useLeoState();
  const modalState = useModal();
  const { LEO_TICKETS, ACTIVE_WARRANTS } = useFeatureEnabled();
  const { hasPermissions } = usePermission();
  const isAdmin = hasPermissions(defaultPermissions.allDefaultAdminPermissions);

  const { currentResult, setCurrentResult } = useNameSearch((state) => ({
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
  }));

  function handleRecordCreate(data: Record) {
    if (!currentResult || currentResult.isConfidential) return;

    setCurrentResult({
      ...currentResult,
      Record: [data, ...currentResult.Record],
    });
  }

  const showModals = isAdmin ? true : leoState.activeOfficer;
  if (!showModals) {
    return null;
  }

  return (
    <>
      <Modals.SwitchDivisionCallsignModal />
      <Modals.NotepadModal />
      <Modals.DepartmentInfoModal />

      {/* name search have their own vehicle/weapon search modal */}
      {modalState.isOpen(ModalIds.NameSearch) ? null : (
        <>
          <Modals.WeaponSearchModal />
          <Modals.VehicleSearchModal id={ModalIds.VehicleSearch} />
          <Modals.BusinessSearchModal />

          {LEO_TICKETS ? (
            <Modals.ManageRecordModal onCreate={handleRecordCreate} type={RecordType.TICKET} />
          ) : null}
          <Modals.ManageRecordModal onCreate={handleRecordCreate} type={RecordType.ARREST_REPORT} />
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
