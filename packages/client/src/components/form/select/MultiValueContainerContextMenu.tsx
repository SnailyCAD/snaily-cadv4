import { components, MultiValueGenericProps } from "react-select";
import { type ContextItem, ContextMenu } from "components/shared/ContextMenu";
import { useValues } from "context/ValuesContext";
import useFetch from "lib/useFetch";
import type { CombinedLeoUnit, StatusValue } from "@snailycad/types";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Full911Call, FullDeputy, useDispatchState } from "state/dispatchState";
import { makeUnitName } from "lib/utils";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";

export function MultiValueContainerContextMenu(props: MultiValueGenericProps<any>) {
  const { codes10 } = useValues();
  const { execute } = useFetch();
  const { getPayload } = useModal();
  const generateCallsign = useGenerateCallsign();
  const call = getPayload<Full911Call>(ModalIds.Manage911Call);
  const { activeDeputies, activeOfficers } = useDispatchState();

  const unitId = props.data.value;
  const unit = [...activeDeputies, ...activeOfficers].find((v) => v.id === unitId) as
    | FullDeputy
    | CombinedLeoUnit;

  async function setCode(status: StatusValue) {
    if (!unit) return;

    if (status.type === "STATUS_CODE") {
      await execute(`/dispatch/status/${unitId}`, {
        method: "PUT",
        data: { status: status.id },
      });
    } else {
      if (!call) return;
      await execute(`/911-calls/events/${call.id}`, {
        method: "POST",
        data: {
          description:
            "officers" in unit
              ? `${unit.callsign} / ${status.value.value}`
              : `${generateCallsign(unit)} ${makeUnitName(unit)} / ${status.value.value}`,
        },
      });
    }
  }

  const codesMapped: ContextItem[] = codes10.values.map((v) => ({
    name: v.value.value,
    onClick: () => setCode(v),
    "aria-label":
      v.type === "STATUS_CODE"
        ? `Set status to ${v.value.value}`
        : `Add code to event: ${v.value.value} `,
    title:
      v.type === "STATUS_CODE"
        ? `Set status to ${v.value.value}`
        : `Add code to event: ${v.value.value} `,
  }));

  if (unit) {
    codesMapped.unshift({
      name: !("officers" in unit)
        ? `${generateCallsign(unit)} ${makeUnitName(unit)}`
        : unit.callsign,
      component: "Label",
    });
  }

  return (
    <ContextMenu items={codesMapped}>
      <components.MultiValueContainer {...props} />
    </ContextMenu>
  );
}
