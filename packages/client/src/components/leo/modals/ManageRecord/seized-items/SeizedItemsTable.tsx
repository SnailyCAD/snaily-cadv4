import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Table } from "components/shared/Table";
import { useModal } from "context/ModalContext";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { ManageSeizedItemsModal } from "./ManageSeizedItemsModal";

export function SeizedItemsTable() {
  const { values } = useFormikContext<{ seizedItems?: any[] }>();
  const { openModal } = useModal();
  const seizedItems = values.seizedItems ?? [];

  const common = useTranslations("Common");
  const t = useTranslations("Leo");

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
              actions: <>TODO</>,
            }))}
            columns={[
              { Header: common("name"), accessor: "item" },
              { Header: t("quantity"), accessor: "quantity" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        ) : (
          <p>No items created yet.</p>
        )}
      </FormField>

      <ManageSeizedItemsModal />
    </>
  );
}
