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
import { useValues } from "context/ValuesContext";
import {
  DivisionValue,
  EmployeeAsEnum,
  EmployeeValue,
  ShouldDoType,
  StatusValue,
  Value,
  ValueType,
} from "types/prisma";
import { useTranslations } from "use-intl";
import { Select } from "components/form/Select";

type TValue = Value | EmployeeValue | StatusValue | DivisionValue;

interface Props {
  type: ValueType;
  value: TValue | null;
  onCreate: (newValue: TValue) => void;
  onUpdate: (oldValue: TValue, newValue: TValue) => void;
}

const BUSINESS_VALUES = [
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

const SHOULD_DO_VALUES = [
  {
    value: ShouldDoType.SET_STATUS,
    label: "Set Status",
  },
  {
    value: ShouldDoType.SET_OFF_DUTY,
    label: "Set off duty",
  },
];

const POSITION_VALUES = new Array(10).fill(0).map((_, idx) => ({
  value: String(idx + 1),
  label: String(idx + 1),
}));

export const ManageValueModal = ({ onCreate, onUpdate, type, value }: Props) => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations(type);
  const common = useTranslations("Common");

  const title = !value ? t("ADD") : t("EDIT");
  const footerTitle = !value ? t("ADD") : common("save");
  const { department } = useValues();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (value) {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${value.id}`, {
        method: "PATCH",
        data: values,
      });

      if (json?.id) {
        closeModal("manageValue");
        onUpdate(value, json);
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
    value: typeof value?.value === "string" ? value.value : value?.value.value ?? "",
    as: typeof value?.value === "string" ? "" : value && "as" in value ? value.as : "",
    shouldDo:
      typeof value?.value === "string" ? "" : value && "shouldDo" in value ? value.shouldDo : "",
    position:
      typeof value?.value === "string" ? "" : value && "position" in value ? value.position : "",
    departmentId:
      typeof value?.value === "string"
        ? ""
        : value && "departmentId" in value
        ? value.departmentId
        : "",
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

            {type === "BUSINESS_ROLE" ? (
              <FormField fieldId="as" label="As (this is so the database knows what to use.)">
                <Select
                  values={BUSINESS_VALUES}
                  name="as"
                  onChange={handleChange}
                  value={values.as}
                />
              </FormField>
            ) : null}

            {type === "DIVISION" ? (
              <FormField fieldId="departmentId" label="Department">
                <Select
                  values={department.values.map((v) => ({
                    value: v.id,
                    label: v.value,
                  }))}
                  name="departmentId"
                  onChange={handleChange}
                  value={values.departmentId}
                />
              </FormField>
            ) : null}

            {type === "CODES_10" ? (
              <>
                <FormField fieldId="shouldDo" label="Should Do">
                  <Select
                    values={SHOULD_DO_VALUES}
                    name="shouldDo"
                    onChange={handleChange}
                    value={values.shouldDo}
                  />
                </FormField>

                <FormField fieldId="position" label="Position">
                  <Select
                    values={POSITION_VALUES}
                    name="position"
                    onChange={handleChange}
                    value={String(values.position)}
                  />
                </FormField>
              </>
            ) : null}

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
