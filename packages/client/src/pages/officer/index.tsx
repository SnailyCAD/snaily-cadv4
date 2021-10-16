import * as React from "react";
import { Layout } from "components/Layout";
import { StatusesArea } from "components/leo/StatusesArea";
import { useAreaOfPlay } from "hooks/useAreaOfPlay";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { useLeoState } from "state/leoState";
import { Officer } from "types/prisma";
import { SelectOfficerModal } from "components/leo/SelectOfficerModal";
import { ActiveCalls } from "components/leo/ActiveCalls";
import { Full911Call, useDispatchState } from "state/dispatchState";

interface Props {
  officers: Officer[];
  activeOfficer: Officer | null;
  calls: Full911Call[];
}

export default function OfficerDashboard({ officers, calls, activeOfficer }: Props) {
  const { showAop, areaOfPlay } = useAreaOfPlay();
  const state = useLeoState();
  const { setCalls } = useDispatchState();

  React.useEffect(() => {
    state.setActiveOfficer(activeOfficer);
    state.setOfficers(officers);
    setCalls(calls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.setActiveOfficer, state.setOfficers, setCalls, calls, officers, activeOfficer]);

  return (
    <Layout>
      <div className="w-full p-4 bg-gray-200/80 rounded-md">
        <header className="mb-2">
          <h3 className="text-2xl font-semibold">
            {"Utility Panel"}
            {showAop ? <span> - AOP: {areaOfPlay}</span> : null}
          </h3>
        </header>

        <div>MODAL BUTTONS</div>

        <StatusesArea />
      </div>

      <ActiveCalls />

      <SelectOfficerModal />
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

  const { data: calls } = await handleRequest("/911-calls", {
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
      values,
      messages: {
        ...(await getTranslations(["common"], locale)),
      },
    },
  };
};
