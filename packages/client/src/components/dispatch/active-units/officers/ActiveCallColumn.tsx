import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "components/Button";
import { Manage911CallModal } from "components/dispatch/modals/Manage911CallModal";
import type { Full911Call } from "state/dispatch/dispatchState";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";

interface Props {
  call: Full911Call | null;
  isDispatch: boolean;
}

export function ActiveCallColumn({ call, isDispatch }: Props) {
  const [open, setOpen] = React.useState(false);
  const common = useTranslations("Common");
  const { hasActiveDispatchers } = useActiveDispatchers();
  const isBtnDisabled = !hasActiveDispatchers && isDispatch;

  function handleOpen() {
    if (isBtnDisabled) return;

    setOpen(true);
  }

  if (!call) {
    return <>{common("none")}</>;
  }

  return (
    <>
      <Button disabled={isBtnDisabled} onClick={handleOpen}>
        #{call.caseNumber}
      </Button>

      {open ? <Manage911CallModal forceOpen call={call} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
