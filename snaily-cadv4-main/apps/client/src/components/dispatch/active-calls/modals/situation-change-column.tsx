import type { AssignedUnit, StatusValue } from "@snailycad/types";
import type { Post911CallEventsData } from "@snailycad/types/api";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@snailycad/ui";
import { useValues } from "context/ValuesContext";
import useFetch from "lib/useFetch";
import { useCall911State } from "state/dispatch/call-911-state";

interface UnitColumnProps {
  unit: AssignedUnit;
  children: React.ReactNode;
  isDisabled?: boolean;
}

export function SituationChangeColumn(props: UnitColumnProps) {
  const { codes10 } = useValues();
  const unitId = props.unit.unit?.id;
  const { execute, state } = useFetch();
  const { call, setCurrentlySelectedCall } = useCall911State((state) => ({
    call: state.currentlySelectedCall,
    setCurrentlySelectedCall: state.setCurrentlySelectedCall,
  }));

  if (props.isDisabled || !unitId) {
    return <span>{props.children}</span>;
  }

  async function handleSituationCodeChange(status: StatusValue) {
    if (!unitId || !call) return;

    const { json } = await execute<Post911CallEventsData>({
      path: `/911-calls/events/${call.id}`,
      data: {
        translationData: { unit: props.unit.unit, status },
        description: "unitSituationCodeChange",
      },
      method: "POST",
    });

    if (json.id) {
      setCurrentlySelectedCall(json);
    }
  }

  const codesMapped = codes10.values
    .filter((v) => v.type === "SITUATION_CODE")
    .map((v) => ({
      disabled: state === "loading",
      name: v.value.value,
      onClick: () => handleSituationCodeChange(v),
      "aria-label": `Add call situation code ${v.value.value}`,
      title: `Add call situation code ${v.value.value}`,
    }));

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger disabled={codesMapped.length <= 0}>
        <span>{props.children}</span>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {codesMapped.map((code) => (
          <ContextMenuItem onClick={code.onClick} key={code.name}>
            {code.name}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
