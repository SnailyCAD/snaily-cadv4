import { CREATE_PENAL_CODE_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import { PenalCode, ValueType } from "types/prisma";
import { useTranslations } from "use-intl";
import { Textarea } from "components/form/Textarea";

interface Props {
  type: ValueType;
  penalCode: PenalCode | null;
  onCreate: (newValue: PenalCode) => void;
  onUpdate: (oldValue: PenalCode, newValue: PenalCode) => void;
}

export const ManagePenalCode = ({ onCreate, onUpdate, type, penalCode }: Props) => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations(type);
  const common = useTranslations("Common");

  const title = !penalCode ? t("ADD") : t("EDIT");
  const footerTitle = !penalCode ? t("ADD") : common("save");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (penalCode) {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${penalCode.id}`, {
        method: "PATCH",
        data: values,
      });

      if (json?.id) {
        closeModal("manageValue");
        onUpdate(penalCode, json);
      }
    } else {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}`, {
        method: "POST",
        data: values,
      });

      if (json?.id) {
        closeModal("manageValue");
        onCreate(json);
      }
    }
  }

  const INITIAL_VALUES = {
    title: penalCode?.title ?? "",
    description: penalCode?.description ?? "",
  };

  const validate = handleValidate(CREATE_PENAL_CODE_SCHEMA);

  return (
    <Modal
      className="min-w-[600px]"
      title={title}
      onClose={() => closeModal("manageValue")}
      isOpen={isOpen("manageValue")}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, values, errors }) => (
          <form onSubmit={handleSubmit}>
            <FormField fieldId="title" label="Title">
              <Input
                autoFocus
                id="title"
                name="title"
                onChange={handleChange}
                value={values.title}
              />
              <Error>{errors.title}</Error>
            </FormField>

            <FormField fieldId="description" label="Description">
              <Textarea
                id="description"
                name="description"
                onChange={handleChange}
                value={values.description}
              />
              <Error>{errors.description}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button type="reset" onClick={() => closeModal("manageValue")} variant="cancel">
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
};
