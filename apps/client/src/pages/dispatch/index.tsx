import * as React from "react";
import dynamic from "next/dynamic";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { ActiveCalls } from "components/dispatch/active-calls/active-calls";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { ActiveBolos } from "components/active-bolos/active-bolos";
import { DispatchModalButtons } from "components/dispatch/utility-configuration";
import { useTranslations } from "use-intl";
import { requestAll } from "lib/utils";
import { useSignal100 } from "hooks/shared/useSignal100";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { Title } from "components/shared/Title";
import { DashboardLayoutCardType, ValueType } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { Permissions } from "@snailycad/permissions";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import type {
  Get911CallsData,
  GetActiveOfficersData,
  GetBolosData,
  GetDispatchData,
  GetEmsFdActiveDeputies,
  GetUserData,
} from "@snailycad/types/api";
import { UtilityPanel } from "components/shared/utility-panel/utility-panel";
import { useCall911State } from "state/dispatch/call-911-state";
import { useActiveDispatcherState } from "state/dispatch/active-dispatcher-state";
import { Infofield } from "@snailycad/ui";
import { ActiveOfficers } from "components/dispatch/active-units/officers/active-officers";
import { ActiveDeputies } from "components/dispatch/active-units/deputies/active-deputies";
import { useAuth } from "context/AuthContext";

const ActiveIncidents = dynamic(async () => {
  return (await import("components/dispatch/active-incidents/active-incidents")).ActiveIncidents;
});

const Modals = {
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
    return (await import("components/leo/modals/weapon-search-modal")).WeaponSearchModal;
  }),
  NotepadModal: dynamic(async () => {
    return (await import("components/shared/NotepadModal")).NotepadModal;
  }),
  AddressSearchModal: dynamic(async () => {
    return (await import("components/dispatch/modals/address-search-modal")).AddressSearchModal;
  }),
};

export interface DispatchPageProps extends GetDispatchData {
  activeDeputies: GetEmsFdActiveDeputies;
  activeOfficers: GetActiveOfficersData;
  calls: Get911CallsData;
  bolos: GetBolosData;
  session: GetUserData | null;
}

export default function DispatchDashboard(props: DispatchPageProps) {
  useLoadValuesClientSide({
    valueTypes: [
      ValueType.CALL_TYPE,
      ValueType.CITIZEN_FLAG,
      ValueType.DRIVERSLICENSE_CATEGORY,
      ValueType.IMPOUND_LOT,
      ValueType.LICENSE,
      ValueType.PENAL_CODE,
      ValueType.VEHICLE_FLAG,
      ValueType.DEPARTMENT,
      ValueType.DIVISION,
      ValueType.ADDRESS_FLAG,
      ValueType.WEAPON_FLAG,
    ],
  });

  const setUserActiveDispatcher = useActiveDispatcherState(
    (state) => state.setUserActiveDispatcher,
  );
  const state = useDispatchState();
  const set911Calls = useCall911State((state) => state.setCalls);
  const t = useTranslations("Leo");
  const { CALLS_911, ACTIVE_INCIDENTS } = useFeatureEnabled();
  const { user } = useAuth();
  const session = user ?? props.session;

  React.useEffect(() => {
    set911Calls(props.calls.calls);
    state.setBolos(props.bolos.bolos);

    setUserActiveDispatcher(props.userActiveDispatcher, props.activeDispatchersCount);

    state.setActiveDeputies(props.activeDeputies);
    state.setActiveOfficers(props.activeOfficers);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  const cards = [
    {
      type: DashboardLayoutCardType.ACTIVE_OFFICERS,
      isEnabled: true,
      children: <ActiveOfficers initialOfficers={props.activeOfficers} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_DEPUTIES,
      isEnabled: true,
      children: <ActiveDeputies initialDeputies={props.activeDeputies} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_CALLS,
      isEnabled: CALLS_911,
      children: <ActiveCalls initialData={props.calls} />,
    },

    {
      type: DashboardLayoutCardType.ACTIVE_INCIDENTS,
      isEnabled: ACTIVE_INCIDENTS,
      children: <ActiveIncidents />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_BOLOS,
      isEnabled: true,
      children: <ActiveBolos initialBolos={props.bolos} />,
    },
  ];

  const layoutOrder = session?.dispatchLayoutOrder ?? [];
  const sortedCards = cards.sort((a, b) => {
    return layoutOrder.indexOf(a.type) - layoutOrder.indexOf(b.type);
  });

  return (
    <Layout permissions={{ permissions: [Permissions.Dispatch] }} className="dark:text-white">
      <Title renderLayoutTitle={false}>{t("dispatch")}</Title>

      <DispatchHeader userActiveDispatcher={props.userActiveDispatcher} />

      {sortedCards.map((card) =>
        card.isEnabled ? <React.Fragment key={card.type}>{card.children}</React.Fragment> : null,
      )}

      <DispatchModals />
    </Layout>
  );
}

function DispatchHeader(props: Pick<DispatchPageProps, "userActiveDispatcher">) {
  const t = useTranslations("Leo");
  const userActiveDispatcher = useActiveDispatcherState((state) => state.userActiveDispatcher);
  const signal100 = useSignal100();
  const panic = usePanicButton();
  const activeDepartment =
    userActiveDispatcher?.department ?? props.userActiveDispatcher?.department;

  return (
    <>
      <signal100.Component enabled={signal100.enabled} audio={signal100.audio} />
      <panic.Component audio={panic.audio} unit={panic.unit} />

      <UtilityPanel isDispatch>
        {activeDepartment ? (
          <Infofield className="px-4 py-2" label={t("activeDepartment")}>
            {activeDepartment.value.value}
          </Infofield>
        ) : null}

        <DispatchModalButtons />
      </UtilityPanel>
    </>
  );
}

function DispatchModals() {
  const modalState = useModal();

  return (
    <>
      <Modals.NotepadModal />
      {/* name search have their own vehicle/weapon search modal */}
      {modalState.isOpen(ModalIds.NameSearch) ? null : (
        <>
          <Modals.WeaponSearchModal id={ModalIds.WeaponSearch} />
          <Modals.VehicleSearchModal id={ModalIds.VehicleSearch} />
        </>
      )}
      <Modals.AddressSearchModal />
      <Modals.NameSearchModal />
      <Modals.CustomFieldSearch />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [values, calls, bolos, activeDispatcherData, activeOfficers, activeDeputies] =
    await requestAll(req, [
      ["/admin/values/codes_10", []],
      ["/911-calls", { calls: [], totalCount: 0 }],
      ["/bolos", { bolos: [], totalCount: 0 }],
      ["/dispatch", { activeDispatchersCount: 0, userActiveDispatcher: null }],
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

      userActiveDispatcher: activeDispatcherData.userActiveDispatcher ?? null,
      activeDispatchersCount: activeDispatcherData.activeDispatchersCount ?? 0,

      messages: {
        ...(await getTranslations(
          ["citizen", "truck-logs", "ems-fd", "leo", "calls", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
