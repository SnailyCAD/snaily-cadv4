import * as React from "react";
import type { LeoIncident } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { ManageIncidentModal } from "components/leo/incidents/ManageIncidentModal";
import { useModal } from "state/modalState";
import { Button } from "components/Button";

interface Props {
  incident: LeoIncident | null;
}

export function ActiveIncidentColumn({ incident }: Props) {
  const [tempIncident, setTempIncident] = React.useState<LeoIncident | null>(null);

  const common = useTranslations("Common");
  const { openModal } = useModal();

  function handleIncidentOpen(incident: LeoIncident) {
    setTempIncident(incident);
    openModal(ModalIds.ManageIncident);
  }

  if (!incident) {
    return <>{common("none")}</>;
  }

  return (
    <>
      <Button
        onClick={() =>
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
