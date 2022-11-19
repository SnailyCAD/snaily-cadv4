import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { hasValueObj, isBaseValue } from "@snailycad/utils/typeguards";
import type { DeleteValueByIdData } from "@snailycad/types/api";
import { useModal } from "state/modalState";
import type { AnyValue, ValueType } from "@snailycad/types";
import type { useAsyncTable } from "components/shared/Table";
import type { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface AlertDeleteValueModalProps<T extends AnyValue> {
  asyncTable: ReturnType<typeof useAsyncTable<T>>;
  valueState: ReturnType<typeof useTemporaryItem<string, T>>;
  type: ValueType;
}

export function AlertDeleteValueModal<T extends AnyValue>(props: AlertDeleteValueModalProps<T>) {
  const { state, execute } = useFetch();
  const t = useTranslations("Values");
  const typeT = useTranslations(props.type);
  const { closeModal } = useModal();
  const [tempValue, valueState] = props.valueState;

  async function handleDelete() {
    if (!tempValue) return;

    const { json } = await execute<DeleteValueByIdData>({
      path: `/admin/values/${props.type.toLowerCase()}/${tempValue.id}`,
      method: "DELETE",
    });

    if (json) {
      props.asyncTable.remove(tempValue.id);
      valueState.setTempId(null);

      closeModal(ModalIds.AlertDeleteValue);
    }
  }

  return (
    <AlertModal
      id={ModalIds.AlertDeleteValue}
      description={t.rich("alert_deleteValue", {
        value:
          tempValue &&
          (isBaseValue(tempValue)
            ? tempValue.value
            : hasValueObj(tempValue)
            ? tempValue.value.value
            : tempValue.title),
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
