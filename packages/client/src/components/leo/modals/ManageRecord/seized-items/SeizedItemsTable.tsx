import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Table } from "components/shared/Table";
import { useModal } from "context/ModalContext";
import { useFormikContext } from "formik";
import { yesOrNoText } from "lib/utils";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { ManageSeizedItemsModal } from "./ManageSeizedItemsModal";

export function SeizedItemsTable() {
  const [tempItem, setTempItem] = React.useState(null);
  const { values, setFieldValue } = useFormikContext<{ seizedItems?: any[] }>();
  const { openModal } = useModal();
  const seizedItems = values.seizedItems ?? [];

  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  function handleEditClick(item: any) {
    openModal(ModalIds.ManageSeizedItems);
    setTempItem(item);
  }

  function handleDeleteClick(item: any) {
    const seizedItems = values.seizedItems ?? [];
    const idxOf = seizedItems.indexOf(item);

    setFieldValue(
      "seizedItems",
      seizedItems.filter((_, idx) => idx !== idxOf),
    );
  }

  return (
    <>
      <FormField className="relative" label="Seized Items">
        <Button
          className="absolute right-0 top-0"
          type="button"
          onClick={() => openModal(ModalIds.ManageSeizedItems)}
        >
          Add
        </Button>

        {seizedItems.length > 0 ? (
          <Table
            data={seizedItems.map((v) => ({
              item: v.item,
              quantity: v.quantity,
              illegal: common(yesOrNoText(v.illegal)),
              actions: (
                <>
                  <Button small type="button" onClick={() => handleEditClick(v)} variant="success">
                    {common("edit")}
                  </Button>
                  <Button
                    className="ml-2"
                    small
                    type="button"
                    onClick={() => handleDeleteClick(v)}
                    variant="danger"
                  >
                    {common("delete")}
                  </Button>
                </>
              ),
            }))}
            columns={[
              { Header: common("name"), accessor: "item" },
              { Header: t("quantity"), accessor: "quantity" },
              { Header: t("illegal"), accessor: "illegal" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        ) : (
          <p>No items created yet.</p>
        )}
      </FormField>

      <ManageSeizedItemsModal onClose={() => setTempItem(null)} item={tempItem} />
    </>
  );
}
