import * as React from "react";
import { Layout } from "components/Layout";
import { ActiveCalls } from "components/leo/ActiveCalls";
import { ModalButtons } from "components/ems-fd/ModalButtons";
import { useAreaOfPlay } from "hooks/useAreaOfPlay";
import { useTime } from "hooks/useTime";
import dynamic from "next/dynamic";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useTranslations } from "use-intl";
import { StatusesArea } from "components/ems-fd/StatusesArea";
import { ActiveDeputy, useEmsFdState } from "state/emsFdState";
import { Full911Call, useDispatchState } from "state/dispatchState";
import { DeputyWithDept } from "./my-deputies";
import { requestAll } from "lib/utils";

interface Props {
  activeDeputy: ActiveDeputy | null;
  deputies: DeputyWithDept[];
  calls: Full911Call[];
}

const NotepadModal = dynamic(async () => {
  return (await import("components/modals/NotepadModal")).NotepadModal;
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

const ActiveDeputiesModal = dynamic(async () => {
  return (await import("components/ems-fd/modals/ActiveDeputiesModal")).ActiveDeputiesModal;
});

export default function EmsFDDashboard({ activeDeputy, calls, deputies }: Props) {
  const { showAop, areaOfPlay } = useAreaOfPlay();
  const timeRef = useTime();

  const state = useEmsFdState();
  const { setCalls } = useDispatchState();

  React.useEffect(() => {
    state.setActiveDeputy(activeDeputy);
    state.setDeputies(deputies);
    setCalls(calls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.setActiveDeputy, state.setDeputies, setCalls, calls, deputies, activeDeputy]);

  const t = useTranslations();

  return (
    <Layout className="max-w-[100rem]">
      <Head>
        <title>{t("Ems.emsFd")} - SnailyCAD</title>
      </Head>

      <div className="w-full bg-gray-200/80 dark:bg-gray-2 rounded-md overflow-hidden">
        <header className="flex items-center justify-between px-4 py-2 bg-gray-300 dark:bg-gray-3 dark:text-white dark:border-b-[1px] dark:border-dark-gray mb-2">
          <h3 className="text-xl font-semibold">
            {t("Leo.utilityPanel")}
            {showAop ? <span> - AOP: {areaOfPlay}</span> : null}
          </h3>

          <span ref={timeRef} />
        </header>

        <div className="px-4">
          <ModalButtons />
        </div>

        <StatusesArea />
      </div>

      <div className="flex flex-col md:flex-row md:space-x-3 mt-3">
        <div className="w-full">
          <ActiveCalls />
        </div>
      </div>

      <SelectDeputyModal />
      <NotepadModal />
      <CreateMedicalRecordModal />
      <SearchMedicalRecordModal />
      <ActiveDeputiesModal />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [values, calls, { deputies, citizens }, activeDeputy] = await requestAll(req, [
    ["/admin/values/codes_10?paths=penal_code", []],
    ["/911-calls", []],
    ["/ems-fd", { deputies: [], citizens: [] }],
    ["/ems-fd/active-deputy", null],
  ]);

  return {
    props: {
      session: await getSessionUser(req.headers),
      activeDeputy,
      deputies,
      calls,
      values,
      citizens,
      messages: {
        ...(await getTranslations(["leo", "ems-fd", "citizen", "calls", "common"], locale)),
      },
    },
  };
};
