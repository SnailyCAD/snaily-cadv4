import * as React from "react";
import dynamic from "next/dynamic";
import { Layout } from "components/Layout";
import { StatusesArea } from "components/leo/StatusesArea";
import { useAreaOfPlay } from "hooks/useAreaOfPlay";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { ActiveOfficer, useLeoState } from "state/leoState";
import { Officer, RecordType } from "types/prisma";
import { ActiveCalls } from "components/leo/ActiveCalls";
import { Full911Call, FullBolo, useDispatchState } from "state/dispatchState";
import { ModalButtons } from "components/leo/ModalButtons";
import { ActiveBolos } from "components/active-bolos/ActiveBolos";
import { CreateWarrant } from "components/leo/CreateWarrant";
import { useTime } from "hooks/useTime";

const NotepadModal = dynamic(async () => {
  return (await import("components/modals/NotepadModal")).NotepadModal;
});

const SelectOfficerModal = dynamic(async () => {
  return (await import("components/leo/modals/SelectOfficerModal")).SelectOfficerModal;
});

const ActiveOfficersModal = dynamic(async () => {
  return (await import("components/leo/modals/ActiveOfficers")).ActiveOfficersModal;
});

const CreateTicketModal = dynamic(async () => {
  return (await import("components/leo/modals/CreateTicketModal")).CreateTicketModal;
});

interface Props {
  officers: Officer[];
  activeOfficer: ActiveOfficer | null;
  calls: Full911Call[];
  bolos: FullBolo[];
}

export default function OfficerDashboard({ officers, bolos, calls, activeOfficer }: Props) {
  const { showAop, areaOfPlay } = useAreaOfPlay();
  const state = useLeoState();
  const { setCalls, setBolos } = useDispatchState();
  const timeRef = useTime();

  React.useEffect(() => {
    state.setActiveOfficer(activeOfficer);
    state.setOfficers(officers);
    setCalls(calls);
    setBolos(bolos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.setActiveOfficer,
    state.setOfficers,
    setBolos,
    setCalls,
    bolos,
    calls,
    officers,
    activeOfficer,
  ]);

  return (
    <Layout className="max-w-[100rem]">
      <div className="w-full bg-gray-200/80 rounded-md overflow-hidden">
        <header className="flex items-center justify-between px-4 py-2 bg-gray-300 mb-2">
          <h3 className="text-xl font-semibold">
            {"Utility Panel"}
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
          <ActiveBolos />
        </div>
        <div className="w-full md:w-96 mt-3 md:mt-0">
          <CreateWarrant />
        </div>
      </div>

      <SelectOfficerModal />
      <NotepadModal />
      <ActiveOfficersModal />

      <div>
        <CreateTicketModal type={RecordType.TICKET} />
        <CreateTicketModal type={RecordType.ARREST_REPORT} />
        <CreateTicketModal type={RecordType.WRITTEN_WARNING} />
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const { data: officers } = await handleRequest("/leo", {
    headers: req.headers,
  }).catch(() => ({ data: [] }));

  const { data: activeOfficer } = await handleRequest("/leo/active-officer", {
    headers: req.headers,
  }).catch(() => ({ data: null }));

  const { data: values } = await handleRequest("/admin/values/codes_10?paths=penal_code").catch(
    () => ({
      data: [],
    }),
  );

  const { data: citizens } = await handleRequest("/citizen", {
    headers: req.headers,
  }).catch(() => ({
    data: [],
  }));

  const { data: calls } = await handleRequest("/911-calls", {
    headers: req.headers,
  }).catch(() => ({
    data: [],
  }));
  const { data: bolos } = await handleRequest("/bolos", {
    headers: req.headers,
  }).catch(() => ({
    data: [],
  }));

  return {
    props: {
      session: await getSessionUser(req.headers),
      activeOfficer,
      officers,
      calls,
      bolos,
      values,
      citizens,
      messages: {
        ...(await getTranslations(["leo", "calls", "common"], locale)),
      },
    },
  };
};
