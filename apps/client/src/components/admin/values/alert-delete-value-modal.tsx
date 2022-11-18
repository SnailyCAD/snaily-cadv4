import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { hasValueObj, isBaseValue } from "@snailycad/utils/typeguards";
import type { DeleteValueByIdData } from "@snailycad/types/api";
import { useModal } from "state/modalState";
import type { AnyValue, ValueType } from "@snailycad/types";

interface AlertDeleteValueModalProps {
  tempValue: AnyValue | null;
  type: ValueType;
}

export function AlertDeleteValueModal(props: AlertDeleteValueModalProps) {
  const { state, execute } = useFetch();
  const t = useTranslations("Values");
  const typeT = useTranslations(props.type);
  const { closeModal } = useModal();

  async function handleDelete() {
    if (!props.tempValue) return;

    const { json } = await execute<DeleteValueByIdData>({
      path: `/admin/values/${props.type.toLowerCase()}/${props.tempValue.id}`,
      method: "DELETE",
    });

    if (json) {
      props.asyncTable.setData((p) => p.filter((v) => v.id !== props.tempValue.id));
      valueState.setTempId(null);
      closeModal(ModalIds.AlertDeleteValue);
    }
  }

  return (
    <AlertModal
      id={ModalIds.AlertDeleteValue}
      description={t.rich("alert_deleteValue", {
        value:
          props.tempValue &&
          (isBaseValue(props.tempValue)
            ? props.tempValue.value
            : hasValueObj(props.tempValue)
            ? props.tempValue.value.value
            : props.tempValue.title),
      })}
      onDeleteClick={handleDelete}
      title={typeT("DELETE")}
      state={state}
      onClose={() => {
        // wait for animation to play out
        setTimeout(() => valueState.setTempId(null), 100);
      }}
    />
  );
}
