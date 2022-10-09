import { Button, Loader, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import type { PenalCodeGroup } from "@snailycad/types";
import type { PutPenalCodeGroupsData, PostPenalCodeGroupsData } from "@snailycad/types/api";

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
      const { json } = await execute<PutPenalCodeGroupsData>({
        path: `/admin/penal-code-group/${group.id}`,
        method: "PUT",
        data: values,
      });

      if (json.id) {
        onUpdate?.(group, json);
        handleClose();
      }
    } else {
      const { json } = await execute<PostPenalCodeGroupsData>({
        path: "/admin/penal-code-group",
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
      className="w-[650px]"
      title={title}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManagePenalCodeGroup)}
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors }) => (
          <Form>
            <TextField
              errorMessage={errors.name}
              autoFocus
              isRequired
              label="Name"
              value={values.name}
              onChange={(value) => setFieldValue("name", value)}
            />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                Cancel
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {footerTitle}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
