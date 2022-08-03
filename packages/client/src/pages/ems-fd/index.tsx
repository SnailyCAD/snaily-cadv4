import * as React from "react";
import { Layout } from "components/Layout";
import { ActiveCalls } from "components/dispatch/active-calls/ActiveCalls";
import { ModalButtons } from "components/ems-fd/ModalButtons";
import dynamic from "next/dynamic";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useTranslations } from "use-intl";
import { StatusesArea } from "components/shared/StatusesArea";
import { useEmsFdState } from "state/emsFdState";
import { useDispatchState } from "state/dispatchState";
import { requestAll } from "lib/utils";
import { ActiveDeputies } from "components/dispatch/ActiveDeputies";
import { ActiveOfficers } from "components/dispatch/ActiveOfficers";
import { useSignal100 } from "hooks/shared/useSignal100";
import { Title } from "components/shared/Title";
import { UtilityPanel } from "components/shared/UtilityPanel";
import { ValueType } from "@snailycad/types";
import { Permissions } from "@snailycad/permissions";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { useTones } from "hooks/global/useTones";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import type {
  Get911CallsData,
  GetEmsFdActiveDeputies,
  GetEmsFdActiveDeputy,
  GetMyDeputiesData,
} from "@snailycad/types/api";

interface Props {
  activeDeputy: GetEmsFdActiveDeputy | null;
  activeDeputies: GetEmsFdActiveDeputies;
  userDeputies: GetMyDeputiesData["deputies"];
  calls: Get911CallsData;
}

const NotepadModal = dynamic(async () => {
  return (await import("components/shared/NotepadModal")).NotepadModal;
});

const SelectDeputyModal = dynamic(async () => {
  return (await import("components/ems-fd/modals/SelectDeputy")).SelectDeputyModal;
});

const CreateMedicalRecordModal = dynamic(async () => {
  return (await import("components/ems-fd/modals/CreateMedicalRecord")).CreateMedicalRecordModal;
});

const SearchMedicalRecordModal = dynamic(async () => {
  return (await import("components/ems-fd/modals/SearchMedicalRecords")).SearchMedicalRecordModal;
});

export default function EmsFDDashboard({
  activeDeputy,
  calls,
  userDeputies,
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

  const signal100 = useSignal100();
  const tones = useTones("ems-fd");
  const panic = usePanicButton();
  const state = useEmsFdState();
  const dispatchState = useDispatchState();

  React.useEffect(() => {
    state.setActiveDeputy(activeDeputy);
    state.setDeputies(userDeputies);
    dispatchState.setCalls(calls);
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
      <tones.Component audio={tones.audio} description={tones.description} />

      <UtilityPanel>
        <div className="px-4">
          <ModalButtons />
        </div>

        <StatusesArea
          setUnits={dispatchState.setActiveDeputies}
          units={dispatchState.activeDeputies}
          setActiveUnit={state.setActiveDeputy}
          activeUnit={state.activeDeputy}
        />
      </UtilityPanel>

      <div className="flex flex-col mt-3 md:flex-row md:space-x-3">
        <div className="w-full">
          <ActiveCalls initialCalls={calls} />
        </div>
      </div>

      <div className="mt-3">
        <ActiveOfficers initialOfficers={{ officers: [], totalCount: 0 }} />
        <ActiveDeputies initialDeputies={activeDeputies} />
      </div>

      <SelectDeputyModal />

      {state.activeDeputy ? (
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
  const [values, calls, { deputies }, activeDeputies, activeDeputy] = await requestAll(req, [
    ["/admin/values/codes_10", []],
    ["/911-calls", []],
    ["/ems-fd", { deputies: [] }],
    ["/ems-fd/active-deputies", []],
    ["/ems-fd/active-deputy", null],
  ]);

  return {
    props: {
      session: user,
      activeDeputy,
      activeDeputies,
      userDeputies: deputies,
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
