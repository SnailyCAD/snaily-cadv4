import * as React from "react";
import type { LeoIncident } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { Button } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";
import type { GetIncidentByIdData } from "@snailycad/types/api";
import { classNames } from "lib/classNames";

const ManageIncidentModal = dynamic(
  async () => (await import("components/leo/incidents/manage-incident-modal")).ManageIncidentModal,
  { ssr: false },
);

interface Props {
  unitId: string;
  incidentId: string | null;
  isDispatch: boolean;
  size?: "sm" | "md";
}

export function ActiveIncidentColumn({ unitId, incidentId, isDispatch, size = "md" }: Props) {
  const [tempIncident, setTempIncident] = React.useState<LeoIncident | null>(null);
  const { execute } = useFetch();

  const { data, isLoading } = useQuery({
    enabled: Boolean(incidentId),
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
  const modalState = useModal();

  const { hasActiveDispatchers } = useActiveDispatchers();
  const isBtnDisabled = !hasActiveDispatchers && isDispatch;

  function handleIncidentOpen(incident: LeoIncident) {
    if (isBtnDisabled) return;

    setTempIncident(incident);
    modalState.openModal(ModalIds.ManageIncident);
  }

  if (!incidentId) {
    return <>{common("none")}</>;
  }

  if (!data || isLoading) {
    return (
      <Button
        size={size}
        disabled
        className={classNames(
          "animate-pulse rounded-md",
          size === "sm" ? "w-10 h-8" : "w-full h-9",
        )}
      />
    );
  }

  return (
    <>
      <Button
        className={classNames("grid place-content-center", size === "sm" ? "w-10 h-8" : "w-10 h-9")}
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
