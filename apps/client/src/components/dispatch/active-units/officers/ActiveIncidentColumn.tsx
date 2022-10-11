import * as React from "react";
import type { LeoIncident } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { ManageIncidentModal } from "components/leo/incidents/ManageIncidentModal";
import { useModal } from "state/modalState";
import { Button } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";

interface Props {
  incident: LeoIncident | null;
  isDispatch: boolean;
}

export function ActiveIncidentColumn({ incident, isDispatch }: Props) {
  const [tempIncident, setTempIncident] = React.useState<LeoIncident | null>(null);

  const common = useTranslations("Common");
  const { openModal } = useModal();

  const { hasActiveDispatchers } = useActiveDispatchers();
  const isBtnDisabled = !hasActiveDispatchers && isDispatch;

  function handleIncidentOpen(incident: LeoIncident) {
    if (isBtnDisabled) return;

    setTempIncident(incident);
    openModal(ModalIds.ManageIncident);
  }

  if (!incident) {
    return <>{common("none")}</>;
  }

  return (
    <>
      <Button
        disabled={isBtnDisabled}
        onPress={() =>
          handleIncidentOpen({
            ...incident,
            isActive: true,
          } as LeoIncident)
        }
      >
        #{incident.caseNumber}
      </Button>

      {tempIncident ? (
        <ManageIncidentModal incident={tempIncident} onClose={() => setTempIncident(null)} />
      ) : null}
    </>
  );
}
