import { Form, Formik, useFormikContext } from "formik";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import type { SeizedItem } from "@snailycad/types";
import { Input } from "components/form/inputs/Input";
import { Toggle } from "components/form/Toggle";

interface Props {
  item?: SeizedItem | null;
}

export function ManageSeizedItemsModal({ item }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { values, setFieldValue } = useFormikContext<{ seizedItems?: any[] }>();

  async function onSubmit(data: typeof INITIAL_VALUES) {
    setFieldValue("seizedItems", [...(values.seizedItems ?? []), data]);
    closeModal(ModalIds.ManageSeizedItems);
  }

  const INITIAL_VALUES = {
    item: item?.item ?? "",
    illegal: item?.illegal ?? false,
    quantity: item?.quantity ?? 1,
  };

  return (
    <Modal
      title={t("createWarrant")}
      isOpen={isOpen(ModalIds.ManageSeizedItems)}
      onClose={() => closeModal(ModalIds.ManageSeizedItems)}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form autoComplete="off">
            <FormField errorMessage={errors.item} label={common("name")}>
              <Input name="item" onChange={handleChange} value={values.item} />
            </FormField>

            <FormField errorMessage={errors.quantity} label={t("quantity")}>
              <Input
                type="number"
                name="quantity"
                onChange={handleChange}
                value={values.quantity}
              />
            </FormField>

            <FormField className="mt-1" checkbox errorMessage={errors.illegal} label={t("illegal")}>
              <Toggle name="illegal" onClick={handleChange} toggled={values.illegal} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageSeizedItems)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={!isValid} type="submit">
                Add
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
