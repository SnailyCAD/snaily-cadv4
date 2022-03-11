import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { StatusesArea } from "components/shared/StatusesArea";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { ActiveOfficer, useLeoState } from "state/leoState";
import { Bolo, Officer, RecordType } from "@snailycad/types";
import { ActiveCalls } from "components/leo/ActiveCalls";
import { Full911Call, useDispatchState } from "state/dispatchState";
import { ModalButtons } from "components/leo/ModalButtons";
import { ActiveBolos } from "components/active-bolos/ActiveBolos";
import { requestAll } from "lib/utils";
import { ActiveOfficers } from "components/dispatch/ActiveOfficers";
import { ActiveDeputies } from "components/dispatch/ActiveDeputies";
import { useSignal100 } from "hooks/shared/useSignal100";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { Title } from "components/shared/Title";
import { UtilityPanel } from "components/shared/UtilityPanel";
import type { FullIncident } from "./incidents";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";

const NotepadModal = dynamic(async () => {
  return (await import("components/modals/NotepadModal")).NotepadModal;
});

const SelectOfficerModal = dynamic(async () => {
  return (await import("components/leo/modals/SelectOfficerModal")).SelectOfficerModal;
});

const CreateTicketModal = dynamic(async () => {
  return (await import("components/leo/modals/ManageRecordModal")).ManageRecordModal;
});

const WeaponSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/WeaponSearchModal")).WeaponSearchModal;
});

const VehicleSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/VehicleSearchModal")).VehicleSearchModal;
});

const NameSearchModal = dynamic(async () => {
  return (await import("components/leo/modals/NameSearchModal/NameSearchModal")).NameSearchModal;
});

const CreateWarrantModal = dynamic(async () => {
  return (await import("components/leo/modals/CreateWarrantModal")).CreateWarrantModal;
});

interface Props {
  officers: Officer[];
  activeOfficer: ActiveOfficer | null;
  calls: Full911Call[];
  bolos: Bolo[];
  activeIncidents: FullIncident[];
}

export default function OfficerDashboard({
  officers,
  bolos,
  calls,
  activeOfficer,
  activeIncidents,
}: Props) {
  const state = useLeoState();
  const { setCalls, setBolos, setActiveOfficers, activeOfficers, setActiveIncidents } =
    useDispatchState();
  const t = useTranslations("Leo");
  const { signal100Enabled, Component, audio: signal100Audio } = useSignal100();
  const { unit, audio, PanicButton } = usePanicButton();
  const { isOpen } = useModal();

  React.useEffect(() => {
    state.setActiveOfficer(activeOfficer);
    state.setOfficers(officers);
    setActiveIncidents(activeIncidents);

    setCalls(calls);
    setBolos(bolos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bolos, calls, officers, activeOfficer]);

  return (
    <Layout className="dark:text-white">
      <Title>{t("officer")}</Title>

      {signal100Enabled ? <Component audio={signal100Audio} /> : null}
      {unit ? <PanicButton audio={audio} unit={unit} /> : null}

      <UtilityPanel>
        <div className="px-4">
          <ModalButtons />
        </div>

        <StatusesArea
          setUnits={setActiveOfficers}
          units={activeOfficers}
          activeUnit={state.activeOfficer}
          setActiveUnit={state.setActiveOfficer}
        />
      </UtilityPanel>

      <ActiveCalls />
      <ActiveBolos />

      <div className="mt-3">
        <ActiveOfficers />
        <ActiveDeputies />
      </div>

      <SelectOfficerModal />
      <NotepadModal />
      {/* name search have their own vehicle/weapon search modal */}
      {isOpen(ModalIds.NameSearch) ? null : (
        <>
          <WeaponSearchModal />
          <VehicleSearchModal />
        </>
      )}
      <NameSearchModal />
      <CreateWarrantModal />

      <div>
        <CreateTicketModal type={RecordType.TICKET} />
        <CreateTicketModal type={RecordType.ARREST_REPORT} />
        <CreateTicketModal type={RecordType.WRITTEN_WARNING} />
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [{ officers, citizens }, activeOfficer, values, calls, bolos, { activeIncidents }] =
    await requestAll(req, [
      ["/leo", { officers: [], citizens: [] }],
      ["/leo/active-officer", null],
      [
        "/admin/values/codes_10?paths=penal_code,impound_lot,license,driverslicense_category,vehicle_flag,citizen_flag",
        [],
      ],
      ["/911-calls", []],
      ["/bolos", []],
      ["/dispatch", { activeIncidents: [] }],
    ]);

  return {
    props: {
      session: await getSessionUser(req),
      activeOfficer,
      officers,
      calls,
      bolos,
      values,
      citizens,
      activeIncidents,
      messages: {
        ...(await getTranslations(
          ["citizen", "leo", "truck-logs", "ems-fd", "calls", "common"],
          locale,
        )),
      },
    },
  };
};
