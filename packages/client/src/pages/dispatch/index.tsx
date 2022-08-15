import * as React from "react";
import dynamic from "next/dynamic";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { ActiveCalls } from "components/dispatch/active-calls/ActiveCalls";
import { useDispatchState } from "state/dispatch/dispatchState";
import { ActiveBolos } from "components/active-bolos/ActiveBolos";
import { DispatchModalButtons } from "components/dispatch/ModalButtons";
import { useTranslations } from "use-intl";
import { ActiveOfficers } from "components/dispatch/ActiveOfficers";
import { ActiveDeputies } from "components/dispatch/ActiveDeputies";
import { requestAll } from "lib/utils";
import { useSignal100 } from "hooks/shared/useSignal100";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { Title } from "components/shared/Title";
import { CombinedLeoUnit, EmsFdDeputy, Officer, ShouldDoType, ValueType } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { Permissions } from "@snailycad/permissions";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import type { Get911CallsData, GetBolosData, GetDispatchData } from "@snailycad/types/api";
import { UtilityPanel } from "components/shared/UtilityPanel";
import { useCall911State } from "state/dispatch/call911State";

const ActiveIncidents = dynamic(async () => {
  return (await import("components/dispatch/ActiveIncidents")).ActiveIncidents;
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
    return (await import("components/leo/modals/WeaponSearchModal")).WeaponSearchModal;
  }),
  NotepadModal: dynamic(async () => {
    return (await import("components/shared/NotepadModal")).NotepadModal;
  }),
  AddressSearchModal: dynamic(async () => {
    return (await import("components/dispatch/modals/AddressSearchModal")).AddressSearchModal;
  }),
};

export interface DispatchPageProps extends GetDispatchData {
  calls: Get911CallsData;
  bolos: GetBolosData;
}

function activeFilter(v: EmsFdDeputy | Officer | CombinedLeoUnit) {
  return Boolean(v.statusId && v.status?.shouldDo !== ShouldDoType.SET_OFF_DUTY);
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
    ],
  });

  const state = useDispatchState();
  const call911State = useCall911State();
  const t = useTranslations("Leo");
  const signal100 = useSignal100();
  const panic = usePanicButton();

  const { ACTIVE_INCIDENTS } = useFeatureEnabled();
  const { isOpen } = useModal();

  const activeOfficers = React.useMemo(
    () => [...props.officers].filter(activeFilter),
    [props.officers],
  );

  const activeDeputies = React.useMemo(
    () => [...props.deputies].filter(activeFilter),
    [props.deputies],
  );

  React.useEffect(() => {
    call911State.setCalls(props.calls);
    state.setBolos(props.bolos);
    state.setAllOfficers(props.officers);

    state.setAllDeputies(props.deputies);
    state.setActiveDispatchers(props.activeDispatchers);
    state.setActiveIncidents(props.activeIncidents);

    state.setActiveDeputies(activeDeputies);
    state.setActiveOfficers(activeOfficers);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, activeDeputies, activeOfficers]);

  return (
    <Layout
      permissions={{ fallback: (u) => u.isDispatch, permissions: [Permissions.Dispatch] }}
      className="dark:text-white"
    >
      <Title renderLayoutTitle={false}>{t("dispatch")}</Title>

      <signal100.Component enabled={signal100.enabled} audio={signal100.audio} />
      <panic.Component audio={panic.audio} unit={panic.unit} />

      <UtilityPanel isDispatch>
        <DispatchModalButtons />
      </UtilityPanel>

      <div className="flex flex-col mt-3 md:flex-row md:space-x-3">
        <div className="w-full">
          <ActiveOfficers initialOfficers={activeOfficers} />
          <ActiveDeputies initialDeputies={activeDeputies} />
        </div>
      </div>

      <div className="mt-3">
        <ActiveCalls initialCalls={props.calls} />
        <ActiveBolos initialBolos={props.bolos} />
        {ACTIVE_INCIDENTS ? <ActiveIncidents /> : null}
      </div>

      <Modals.NotepadModal />
      {/* name search have their own vehicle/weapon search modal */}
      {isOpen(ModalIds.NameSearch) ? null : (
        <>
          <Modals.WeaponSearchModal id={ModalIds.WeaponSearch} />
          <Modals.VehicleSearchModal id={ModalIds.VehicleSearch} />
        </>
      )}
      <Modals.AddressSearchModal />
      <Modals.NameSearchModal />
      <Modals.CustomFieldSearch />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [values, calls, bolos, { officers, deputies, activeDispatchers, activeIncidents }] =
    await requestAll(req, [
      ["/admin/values/codes_10", []],
      ["/911-calls", []],
      ["/bolos", []],
      ["/dispatch", { deputies: [], officers: [], activeDispatchers: [], activeIncidents: [] }],
    ]);

  return {
    props: {
      session: user,
      calls,
      bolos,
      values,
      officers,
      deputies,
      activeDispatchers,
      activeIncidents,
      messages: {
        ...(await getTranslations(
          ["citizen", "truck-logs", "ems-fd", "leo", "calls", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
