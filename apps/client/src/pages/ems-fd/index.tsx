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
import { ActiveDeputies } from "components/dispatch/active-deputies";
import { ActiveOfficers } from "components/dispatch/active-officers";
import { useSignal100 } from "hooks/shared/useSignal100";
import { Title } from "components/shared/Title";
import { UtilityPanel } from "components/shared/UtilityPanel";
import { ActiveToneType, Rank, ValueType } from "@snailycad/types";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { useTones } from "hooks/global/use-tones";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import type {
  Get911CallsData,
  GetEmsFdActiveDeputies,
  GetEmsFdActiveDeputy,
} from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import { usePermission } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

interface Props {
  activeDeputy: GetEmsFdActiveDeputy | null;
  activeDeputies: GetEmsFdActiveDeputies;
  calls: Get911CallsData;
}

const NotepadModal = dynamic(
  async () => (await import("components/shared/NotepadModal")).NotepadModal,
  { ssr: false },
);

const SelectDeputyModal = dynamic(
  async () => (await import("components/ems-fd/modals/select-deputy-modal")).SelectDeputyModal,
  { ssr: false },
);

const CreateMedicalRecordModal = dynamic(
  async () =>
    (await import("components/ems-fd/modals/CreateMedicalRecord")).CreateMedicalRecordModal,
  { ssr: false },
);

const SearchMedicalRecordModal = dynamic(
  async () =>
    (await import("components/ems-fd/modals/SearchMedicalRecords")).SearchMedicalRecordModal,
  { ssr: false },
);

export default function EmsFDDashboard({ activeDeputy, calls, activeDeputies }: Props) {
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
  const signal100 = useSignal100();
  const tones = useTones(ActiveToneType.EMS_FD);
  const panic = usePanicButton();
  const state = useEmsFdState();
  const dispatchState = useDispatchState();
  const set911Calls = useCall911State((state) => state.setCalls);
  const { hasPermissions } = usePermission();
  const isAdmin = hasPermissions(
    defaultPermissions.allDefaultAdminPermissions,
    (u) => u.rank !== Rank.USER,
  );

  React.useEffect(() => {
    state.setActiveDeputy(activeDeputy);
    set911Calls(calls.calls);
    dispatchState.setActiveDeputies(activeDeputies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeputies, activeDeputy, calls]);

  const t = useTranslations();

  return (
    <Layout
      permissions={{ fallback: (u) => u.isEmsFd, permissions: [Permissions.EmsFd] }}
      className="dark:text-white"
    >
      <Title renderLayoutTitle={false}>{t("Ems.emsFd")}</Title>

      <signal100.Component enabled={signal100.enabled} audio={signal100.audio} />
      <panic.Component audio={panic.audio} unit={panic.unit} />
      <tones.Component audio={tones.audio} description={tones.description} user={tones.user} />

      <UtilityPanel>
        <div className="px-4">
          <ModalButtons initialActiveDeputy={activeDeputy} />
        </div>

        <StatusesArea
          setUnits={dispatchState.setActiveDeputies}
          units={dispatchState.activeDeputies}
          setActiveUnit={state.setActiveDeputy}
          activeUnit={state.activeDeputy}
          initialData={activeDeputy}
        />
      </UtilityPanel>

      <div className="flex flex-col mt-3 md:flex-row md:space-x-3">
        <div className="w-full">{CALLS_911 ? <ActiveCalls initialData={calls} /> : null}</div>
      </div>
      <div className="mt-3">
        <ActiveOfficers initialOfficers={[]} />
        <ActiveDeputies initialDeputies={activeDeputies} />
      </div>

      <SelectDeputyModal />

      {isAdmin || state.activeDeputy ? (
        <>
          <NotepadModal />
          <CreateMedicalRecordModal />
          <SearchMedicalRecordModal />
        </>
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [values, calls, activeDeputies, activeDeputy] = await requestAll(req, [
    ["/admin/values/codes_10", []],
    ["/911-calls", { calls: [], totalCount: 0 }],
    ["/ems-fd/active-deputies", []],
    ["/ems-fd/active-deputy", null],
  ]);

  return {
    props: {
      session: user,
      activeDeputy,
      activeDeputies,
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
