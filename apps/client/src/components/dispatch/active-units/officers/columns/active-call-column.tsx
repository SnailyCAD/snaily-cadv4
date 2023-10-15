import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useCall911State } from "state/dispatch/call-911-state";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";
import type { Get911CallByIdData } from "@snailycad/types/api";
import { classNames } from "lib/classNames";

const Manage911CallModal = dynamic(
  async () =>
    (await import("components/dispatch/active-calls/modals/manage-911-call-modal"))
      .Manage911CallModal,
  { ssr: false },
);

interface Props {
  unitId: string;
  callId: string | null;
  isDispatch: boolean;
  size?: "md" | "sm";
}

export function ActiveCallColumn({ unitId, callId, isDispatch, size = "md" }: Props) {
  const [open, setOpen] = React.useState(false);
  const common = useTranslations("Common");
  const { hasActiveDispatchers } = useActiveDispatchers();
  const isBtnDisabled = !hasActiveDispatchers && isDispatch;
  const setCurrentlySelectedCall = useCall911State((state) => state.setCurrentlySelectedCall);
  const { execute } = useFetch();

  const { data, isLoading } = useQuery({
    enabled: Boolean(callId),
    queryKey: [unitId, callId],
    queryFn: async () => {
      const { json } = await execute<Get911CallByIdData>({
        path: `/911-calls/${callId}`,
        noToast: true,
      });
      return json;
    },
  });

  function handleOpen() {
    if (isBtnDisabled || !data) return;

    setCurrentlySelectedCall(data);
    setOpen(true);
  }

  if (!callId) {
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
        className={classNames(
          "grid place-content-center",
          size === "sm" ? "max-w-fit h-8 px-2" : "max-w-fit h-9",
        )}
        size={size}
        disabled={isBtnDisabled}
        onPress={handleOpen}
      >
        #{data.caseNumber}
      </Button>

      {open ? <Manage911CallModal forceOpen call={data} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
