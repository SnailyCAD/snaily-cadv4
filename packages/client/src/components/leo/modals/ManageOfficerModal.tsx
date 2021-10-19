import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { OfficerWithDept } from "src/pages/officer/my-officers";
import { ModalIds } from "types/ModalIds";
import { Officer } from "types/prisma";
import { useTranslations } from "use-intl";

interface Props {
  officer: Officer | null;
  onCreate?: (officer: OfficerWithDept) => void;
}

export const ManageOfficerModal = ({ officer, onCreate }: Props) => {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  const { state, execute } = useFetch();
  const { department, division } = useValues();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (officer) {
      const { json } = await execute(`/leo/${officer.id}`, {
        method: "PUT",
        data: values,
      });

      if (json.id) {
        //   todo
      }
    } else {
      const { json } = await execute("/leo", {
        method: "POST",
        data: values,
      });

      if (json.id) {
        closeModal(ModalIds.ManageOfficer);
        onCreate?.(json);
      }
    }
  }

  const validate = handleValidate(CREATE_OFFICER_SCHEMA);
  const INITIAL_VALUES = {
    name: officer?.name ?? "",
    department: officer?.departmentId ?? "",
    rank: officer?.rankId ?? "",
    callsign: officer?.callsign ?? "",
    division: officer?.divisionId ?? "",
  };

  return (
    <Modal
      title={officer ? t("editOfficer") : t("createOfficer")}
      onClose={() => closeModal(ModalIds.ManageOfficer)}
      isOpen={isOpen(ModalIds.ManageOfficer)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField label={t("officerName")}>
              <Input
                value={values.name}
                hasError={!!errors.name}
                id="name"
                onChange={handleChange}
              />
              <Error>{errors.name}</Error>
            </FormField>

            <FormField label={t("callsign")}>
              <Input
                value={values.callsign}
                hasError={!!errors.callsign}
                id="callsign"
                onChange={handleChange}
              />
              <Error>{errors.callsign}</Error>
            </FormField>

            <FormField label={t("department")}>
              <Select
                value={values.department}
                hasError={!!errors.department}
                name="department"
                onChange={handleChange}
                values={department.values.map((value) => ({
                  label: value.value,
                  value: value.id,
                }))}
              />
              <Error>{errors.department}</Error>
            </FormField>

            <FormField label={t("division")}>
              <Select
                value={values.division}
                hasError={!!errors.division}
                name="division"
                onChange={handleChange}
                values={division.values
                  .filter((v) => (values.department ? v.departmentId === values.department : true))
                  .map((value) => ({
                    label: value.value.value,
                    value: value.id,
                  }))}
              />
              <Error>{errors.division}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageOfficer)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {officer ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
