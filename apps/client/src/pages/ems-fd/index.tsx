import * as React from "react";
import { Layout } from "components/Layout";
import { ActiveCalls } from "components/dispatch/active-calls/active-calls";
import { ModalButtons } from "components/ems-fd/ModalButtons";
import dynamic from "next/dynamic";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useTranslations } from "use-intl";
import { StatusesArea } from "components/shared/StatusesArea";
import { useEmsFdState } from "state/ems-fd-state";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { requestAll } from "lib/utils";
import { ActiveOfficers } from "components/dispatch/active-units/officers/active-officers";
import { ActiveDeputies } from "components/dispatch/active-units/deputies/active-deputies";
import { useSignal100 } from "hooks/shared/useSignal100";
import { Title } from "components/shared/Title";
import { UtilityPanel } from "components/shared/UtilityPanel";
import { ActiveToneType, ValueType } from "@snailycad/types";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { useTones } from "hooks/global/use-tones";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import type {
  Get911CallsData,
  GetActiveOfficersData,
  GetEmsFdActiveDeputies,
  GetEmsFdActiveDeputy,
} from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import { usePermission } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";

interface Props {
  activeDeputy: GetEmsFdActiveDeputy | null;
  activeDeputies: GetEmsFdActiveDeputies;
  activeOfficers: GetActiveOfficersData;
  calls: Get911CallsData;
}

const NotepadModal = dynamic(
  async () => (await import("components/shared/NotepadModal")).NotepadModal,
  { ssr: false },
);

const SelectDeputyModal = dynamic(
  async () =>
    (await import("components/ems-fd/modals/deputy/select-deputy-modal")).SelectDeputyModal,
  { ssr: false },
);

const CreateMedicalRecordModal = dynamic(
  async () =>
    (await import("components/ems-fd/modals/create-medical-record-modal")).CreateMedicalRecordModal,
  { ssr: false },
);

const CreateDoctorVisitModal = dynamic(
  async () =>
    (await import("components/ems-fd/modals/doctor-visits/create-doctor-visit-modal"))
      .CreateDoctorVisitModal,
  { ssr: false },
);

const SearchMedicalRecordModal = dynamic(
  async () =>
    (await import("components/ems-fd/modals/search-medical-records/search-medical-records-modal"))
      .SearchMedicalRecordModal,
  { ssr: false },
);

const DepartmentInfoModal = dynamic(async () => {
  return (await import("components/leo/modals/department-info-modal")).DepartmentInformationModal;
});

export default function EmsFDDashboard({
  activeDeputy,
  calls,
  activeOfficers,
  activeDeputies,
}: Props) {
  useLoadValuesClientSide({
    valueTypes: [
      ValueType.BLOOD_GROUP,
      ValueType.PENAL_CODE,
      ValueType.IMPOUND_LOT,
      ValueType.DEPARTMENT,
      ValueType.DIVISION,
    ],
  });

  const { CALLS_911 } = useFeatureEnabled();
  const setActiveDeputy = useEmsFdState((state) => state.setActiveDeputy);
  const dispatchState = useDispatchState((state) => ({
    setBolos: state.setBolos,
    setActiveOfficers: state.setActiveOfficers,
    setActiveDeputies: state.setActiveDeputies,
  }));
  const set911Calls = useCall911State((state) => state.setCalls);

  React.useEffect(() => {
    setActiveDeputy(activeDeputy);
    set911Calls(calls.calls);
    dispatchState.setActiveDeputies(activeDeputies);
    dispatchState.setActiveOfficers(activeOfficers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeputies, activeDeputy, calls]);

  const t = useTranslations();

  return (
    <Layout permissions={{ permissions: [Permissions.EmsFd] }} className="dark:text-white">
      <Title renderLayoutTitle={false}>{t("Ems.emsFd")}</Title>

      <EmsFdHeader activeDeputy={activeDeputy} />

      {CALLS_911 ? <ActiveCalls initialData={calls} /> : null}
      <ActiveOfficers initialOfficers={activeOfficers} />
      <ActiveDeputies initialDeputies={activeDeputies} />

      <SelectDeputyModal />
      <EmsFdModals />
    </Layout>
  );
}

function EmsFdHeader(props: Pick<Props, "activeDeputy">) {
  const signal100 = useSignal100();
  const tones = useTones(ActiveToneType.EMS_FD);
  const panic = usePanicButton();
  const state = useEmsFdState();

  const dispatchState = useDispatchState((state) => ({
    activeDeputies: state.activeDeputies,
    setActiveDeputies: state.setActiveDeputies,
  }));

  return (
    <>
      <signal100.Component enabled={signal100.enabled} audio={signal100.audio} />
      <panic.Component audio={panic.audio} unit={panic.unit} />
      <tones.Component audio={tones.audio} description={tones.description} user={tones.user} />

      <UtilityPanel>
        <div className="px-4">
          <ModalButtons initialActiveDeputy={props.activeDeputy} />
        </div>

        <StatusesArea
          setUnits={dispatchState.setActiveDeputies}
          units={dispatchState.activeDeputies}
          setActiveUnit={state.setActiveDeputy}
          activeUnit={state.activeDeputy}
          initialData={props.activeDeputy}
        />
      </UtilityPanel>
    </>
  );
}

function EmsFdModals() {
  const emsFdDeputyState = useEmsFdState();
  const modalState = useModal();
  const { hasPermissions } = usePermission();
  const isAdmin = hasPermissions(defaultPermissions.allDefaultAdminPermissions);

  const showModals = isAdmin ? true : emsFdDeputyState.activeDeputy;
  if (!showModals) {
    return null;
  }

  return (
    <>
      <NotepadModal />
      <DepartmentInfoModal />

      <SearchMedicalRecordModal />
      {modalState.isOpen(ModalIds.SearchMedicalRecord) ? null : (
        <>
          <CreateMedicalRecordModal />
          <CreateDoctorVisitModal />
        </>
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [values, calls, activeDeputies, activeDeputy, activeOfficers] = await requestAll(req, [
    ["/admin/values/codes_10", []],
    ["/911-calls", { calls: [], totalCount: 0 }],
    ["/ems-fd/active-deputies", []],
    ["/ems-fd/active-deputy", null],
    ["/leo/active-officers", []],
  ]);

  return {
    props: {
      session: user,
      activeDeputy,
      activeDeputies,
      activeOfficers,
      calls,
      values,
      messages: {
        ...(await getTranslations(
          ["leo", "ems-fd", "citizen", "calls", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
