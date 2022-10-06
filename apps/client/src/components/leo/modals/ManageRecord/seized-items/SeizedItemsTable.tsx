import * as React from "react";
import { Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Table, useTableState } from "components/shared/Table";
import { useModal } from "state/modalState";
import { useFormikContext } from "formik";
import { yesOrNoText } from "lib/utils";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { ManageSeizedItemsModal } from "./ManageSeizedItemsModal";
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
    openModal(ModalIds.ManageSeizedItems);
    itemState.setTempId(item.id);
  }

  function handleDeleteClick(item: any) {
    const seizedItems = values.seizedItems;
    const idxOf = seizedItems.indexOf(item);

    setFieldValue(
      "seizedItems",
      seizedItems.filter((_, idx) => idx !== idxOf),
    );
  }

  return (
    <>
      <FormField className="relative mt-3 mb-2" label={t("seizedItems")}>
        <Button
          className="absolute right-0 top-0"
          type="button"
          onPress={() => openModal(ModalIds.ManageSeizedItems)}
          disabled={isReadOnly}
        >
          {t("add")}
        </Button>

        {values.seizedItems.length > 0 ? (
          <Table
            features={{ isWithinCard: true }}
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
      </FormField>

      <ManageSeizedItemsModal onClose={() => itemState.setTempId(null)} item={tempItem} />
    </>
  );
}
