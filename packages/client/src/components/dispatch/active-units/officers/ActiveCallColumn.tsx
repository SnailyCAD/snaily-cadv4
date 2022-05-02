import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "components/Button";
import { Manage911CallModal } from "components/dispatch/modals/Manage911CallModal";
import type { Full911Call } from "state/dispatchState";

interface Props {
  call: Full911Call | null;
}

export function ActiveCallColumn({ call }: Props) {
  const [open, setOpen] = React.useState(false);
  const common = useTranslations("Common");

  if (!call) {
    return <>{common("none")}</>;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>#{call.caseNumber}</Button>

      {open ? <Manage911CallModal forceOpen call={call} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
