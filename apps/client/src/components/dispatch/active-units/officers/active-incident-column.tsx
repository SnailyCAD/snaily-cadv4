import * as React from "react";
import type { LeoIncident } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { Button } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";
import { GetIncidentByIdData } from "@snailycad/types/api";

const ManageIncidentModal = dynamic(
  async () => (await import("components/leo/incidents/manage-incident-modal")).ManageIncidentModal,
  { ssr: false },
);

interface Props {
  unitId: string;
  incidentId: string | null;
  isDispatch: boolean;
}

export function ActiveIncidentColumn({ unitId, incidentId, isDispatch }: Props) {
  const [tempIncident, setTempIncident] = React.useState<LeoIncident | null>(null);
  const { execute } = useFetch();

  const { data, isLoading } = useQuery({
    enabled: !!incidentId,
    queryKey: [unitId, incidentId],
    queryFn: async () => {
      const { json } = await execute<GetIncidentByIdData<"leo">>({
        path: `/incidents/${incidentId}`,
        noToast: true,
      });
      return json;
    },
  });

  const common = useTranslations("Common");
  const { openModal } = useModal();

  const { hasActiveDispatchers } = useActiveDispatchers();
  const isBtnDisabled = !hasActiveDispatchers && isDispatch;

  function handleIncidentOpen(incident: LeoIncident) {
    if (isBtnDisabled) return;

    setTempIncident(incident);
    openModal(ModalIds.ManageIncident);
  }

  if (!incidentId) {
    return <>{common("none")}</>;
  }

  if (!data || isLoading) {
    return <Button disabled className="animate-pulse w-full h-9 rounded-md" />;
  }

  return (
    <>
      <Button
        disabled={isBtnDisabled}
        onPress={() =>
          handleIncidentOpen({
            ...data,
            isActive: true,
          } as LeoIncident)
        }
      >
        #{data.caseNumber}
      </Button>

      {tempIncident ? (
        <ManageIncidentModal
          type="leo"
          incident={tempIncident}
          onClose={() => setTempIncident(null)}
        />
      ) : null}
    </>
  );
}
