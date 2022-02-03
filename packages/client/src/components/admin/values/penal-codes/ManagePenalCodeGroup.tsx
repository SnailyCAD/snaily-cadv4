import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import type { PenalCodeGroup } from "@snailycad/types";

interface Props {
  group: PenalCodeGroup | null;
  onClose?(): void;
  onCreate?(group: PenalCodeGroup): void;
  onUpdate?(oldGroup: PenalCodeGroup, group: PenalCodeGroup): void;
}

export function ManagePenalCodeGroup({ onCreate, onUpdate, onClose, group }: Props) {
  const { closeModal, isOpen } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");

  const footerTitle = group ? common("save") : common("create");
  const title = group ? "Manage Group" : "Add Group";

  function handleClose() {
    closeModal(ModalIds.ManagePenalCodeGroup);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (group) {
      const { json } = await execute(`/admin/penal-code-group/${group.id}`, {
        method: "PUT",
        data: values,
      });

      if (json.id) {
        onUpdate?.(group, json);
        handleClose();
      }
    } else {
      const { json } = await execute("/admin/penal-code-group", {
        method: "POST",
        data: values,
      });

      if (json.id) {
        onCreate?.(json);
        handleClose();
      }
    }
  }

  const INITIAL_VALUES = {
    name: group?.name ?? "",
  };

  return (
    <Modal
      className="w-[750px]"
      title={title}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManagePenalCodeGroup)}
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, values, errors }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.name} label="Name">
              <Input autoFocus name="name" onChange={handleChange} value={values.name} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
                Cancel
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {footerTitle}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
}
