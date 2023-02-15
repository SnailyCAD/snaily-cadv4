import { Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { TabsContent } from "components/shared/TabList";
import { useFormikContext } from "formik";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import { useCall911State } from "state/dispatch/call-911-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

import dynamic from "next/dynamic";
import { shallow } from "zustand/shallow";
import type { Record } from "@snailycad/types";

const ManageIncidentModal = dynamic(
  async () => (await import("components/leo/incidents/manage-incident-modal")).ManageIncidentModal,
);

const Manage911CallModal = dynamic(
  async () => (await import("components/dispatch/modals/Manage911CallModal")).Manage911CallModal,
);

interface _FormikContext {
  call911Id: string | null;
  incidentId: string | null;
}

export function ConnectionsTab({
  isReadOnly,
  record,
}: {
  record?: Record | null;
  isReadOnly?: boolean;
}) {
  const t = useTranslations("Leo");
  const { handleChange, errors, values } = useFormikContext<_FormikContext>();

  console.log({ record });

  const { calls, setCurrentlySelectedCall } = useCall911State(
    (state) => ({
      calls: state.calls,
      setCurrentlySelectedCall: state.setCurrentlySelectedCall,
    }),
    shallow,
  );
  const { activeIncidents } = useActiveIncidents();
  const { openModal } = useModal();

  const incident =
    (record as any)?.incident ??
    activeIncidents.find((incident) => incident.id === values.incidentId) ??
    null;

  const call =
    (record as any)?.call911 ?? calls.find((call) => call.id === values.call911Id) ?? null;

  return (
    <TabsContent value="connections-tab">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">{t("connections")}</h3>
      </header>

      <FormField optional errorMessage={errors.incidentId as string} label={t("incident")}>
        <div className="flex gap-2">
          <Select
            className="w-full"
            disabled={isReadOnly}
            values={activeIncidents.map((incident) => ({
              value: incident.id,
              label: `#${incident.caseNumber}`,
            }))}
            value={incident?.id || values.incidentId}
            onChange={handleChange}
            name="incidentId"
            isClearable
          />
          {values.incidentId ? (
            <>
              <Button
                onClick={() => {
                  openModal(ModalIds.ManageIncident);
                }}
                className="min-w-fit"
              >
                {t("viewIncident")}
              </Button>

              {incident ? <ManageIncidentModal incident={incident} /> : null}
            </>
          ) : null}
        </div>
      </FormField>

      <FormField optional errorMessage={errors.call911Id as string} label={t("call")}>
        <div className="flex gap-2">
          <Select
            className="w-full"
            disabled={isReadOnly}
            values={calls.map((call) => ({
              value: call.id,
              label: `#${call.caseNumber}`,
            }))}
            value={call?.id || values.call911Id}
            onChange={handleChange}
            name="call911Id"
            isClearable
          />
          {values.call911Id ? (
            <>
              <Button
                onClick={() => {
                  setCurrentlySelectedCall(call);
                  openModal(ModalIds.Manage911Call);
                }}
                className="min-w-fit"
              >
                {t("viewCall")}
              </Button>

              {call ? <Manage911CallModal call={call} forceDisabled /> : null}
            </>
          ) : null}
        </div>
      </FormField>
    </TabsContent>
  );
}
