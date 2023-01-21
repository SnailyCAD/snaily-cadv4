import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@snailycad/ui";
import { Manage911CallModal } from "components/dispatch/modals/Manage911CallModal";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useCall911State } from "state/dispatch/call-911-state";

interface Props {
  call: Full911Call | null;
  isDispatch: boolean;
}

export function ActiveCallColumn({ call, isDispatch }: Props) {
  const [open, setOpen] = React.useState(false);
  const common = useTranslations("Common");
  const { hasActiveDispatchers } = useActiveDispatchers();
  const isBtnDisabled = !hasActiveDispatchers && isDispatch;
  const setCurrentlySelectedCall = useCall911State((state) => state.setCurrentlySelectedCall);

  function handleOpen() {
    if (isBtnDisabled) return;

    setCurrentlySelectedCall(call);
    setOpen(true);
  }

  if (!call) {
    return <>{common("none")}</>;
  }

  return (
    <>
      <Button disabled={isBtnDisabled} onPress={handleOpen}>
        #{call.caseNumber}
      </Button>

      {open ? <Manage911CallModal forceOpen call={call} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
