import { Button } from "@snailycad/ui";
import { Table, useTableState } from "components/shared/Table";
import { useModal } from "state/modalState";
import { useFormikContext } from "formik";
import { yesOrNoText } from "lib/utils";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { ManageSeizedItemsModal } from "./manage-seized-items-modal";
import type { SeizedItem } from "@snailycad/types";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

export function SeizedItemsTable({ isReadOnly }: { isReadOnly?: boolean }) {
  const { values, setFieldValue } = useFormikContext<{ seizedItems: SeizedItem[] }>();
  const { openModal } = useModal();
  const [tempItem, itemState] = useTemporaryItem(values.seizedItems);

  const tableState = useTableState();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  function handleEditClick(item: SeizedItem) {
    itemState.setTempId(item.id);
    openModal(ModalIds.ManageSeizedItems);
  }

  function handleDeleteClick(item: SeizedItem) {
    const seizedItems = values.seizedItems;

    setFieldValue(
      "seizedItems",
      seizedItems.filter((_item) => _item.id !== item.id),
    );
  }

  return (
    <>
      {values.seizedItems.length > 0 ? (
        <Table
          features={{ isWithinCardOrModal: true }}
          tableState={tableState}
          data={values.seizedItems.map((v) => ({
            id: v.id,
            item: v.item,
            quantity: v.quantity,
            illegal: common(yesOrNoText(v.illegal)),
            actions: (
              <>
                <Button
                  disabled={isReadOnly}
                  size="xs"
                  type="button"
                  onPress={() => handleEditClick(v)}
                  variant="success"
                >
                  {common("edit")}
                </Button>
                <Button
                  className="ml-2"
                  size="xs"
                  type="button"
                  onPress={() => handleDeleteClick(v)}
                  variant="danger"
                  disabled={isReadOnly}
                >
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: common("name"), accessorKey: "item" },
            { header: t("quantity"), accessorKey: "quantity" },
            { header: t("illegal"), accessorKey: "illegal" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      ) : (
        <p>{t("noSeizedItems")}</p>
      )}

      <ManageSeizedItemsModal onClose={() => itemState.setTempId(null)} item={tempItem} />
    </>
  );
}
