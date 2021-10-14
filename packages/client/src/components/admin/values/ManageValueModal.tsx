import { VALUE_SCHEMA } from "@snailycad/schemas";
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
import { EmployeeAsEnum, EmployeeValue, Value, ValueType } from "types/prisma";
import { useTranslations } from "use-intl";
import { Select } from "components/form/Select";

interface Props {
  type: ValueType;
  value: Value | EmployeeValue | null;
  onCreate: (newValue: Value | EmployeeValue) => void;
  onUpdate: (oldValue: Value | EmployeeValue, newValue: Value | EmployeeValue) => void;
}

const VALUES = [
  {
    value: EmployeeAsEnum.OWNER,
    label: "Owner",
  },
  {
    value: EmployeeAsEnum.MANAGER,
    label: "Manager",
  },
  {
    value: EmployeeAsEnum.EMPLOYEE,
    label: "Employee",
  },
];

export const ManageValueModal = ({ onCreate, onUpdate, type, value }: Props) => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Values");
  const common = useTranslations("Common");

  const title = !value ? t(`CREATE_${type}`) : t(`EDIT_${type}`);
  const footerTitle = !value ? t(`CREATE_${type}`) : common("save");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (value) {
      const { json } = await execute(
        `/admin/values/${type.replace("_", "-").toLowerCase()}/${value.id}`,
        {
          method: "PATCH",
          data: values,
        },
      );

      if (json?.id) {
        closeModal("manageValue");
        onUpdate(value, json);
      }
    } else {
      const { json } = await execute(`/admin/values/${type.replace("_", "-").toLowerCase()}`, {
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
    value: typeof value?.value === "string" ? value.value : value?.value.value ?? "",
    as: typeof value?.value === "string" ? "" : value && "as" in value ? value.as : "",
  };

  const validate = handleValidate(VALUE_SCHEMA);

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
            <FormField fieldId="value" label="Value">
              <Input
                autoFocus
                id="value"
                name="value"
                onChange={handleChange}
                value={values.value}
              />
              <Error>{errors.value}</Error>
            </FormField>

            <FormField fieldId="as" label="As (this is so the database knows what to use.)">
              <Select values={VALUES} name="as" onChange={handleChange} value={values.as} />
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
