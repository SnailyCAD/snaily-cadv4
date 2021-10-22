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
import { FullOfficer } from "state/dispatchState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

interface Props {
  deputy: FullOfficer | null;
  onCreate?: (officer: FullOfficer) => void;
  onUpdate?: (old: FullOfficer, newO: FullOfficer) => void;
  onClose?: () => void;
}

export const ManageDeputyModal = ({ deputy, onClose, onUpdate, onCreate }: Props) => {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations();

  const { state, execute } = useFetch();
  const { department, division } = useValues();

  function handleClose() {
    closeModal(ModalIds.ManageDeputy);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (deputy) {
      const { json } = await execute(`/ems-fd/${deputy.id}`, {
        method: "PUT",
        data: values,
      });

      if (json.id) {
        onUpdate?.(deputy, json);
        closeModal(ModalIds.ManageDeputy);
      }
    } else {
      const { json } = await execute("/ems-fd", {
        method: "POST",
        data: values,
      });

      if (json.id) {
        closeModal(ModalIds.ManageDeputy);
        onCreate?.(json);
      }
    }
  }

  const validate = handleValidate(CREATE_OFFICER_SCHEMA);
  const INITIAL_VALUES = {
    name: deputy?.name ?? "",
    department: deputy?.departmentId ?? "",
    rank: deputy?.rankId ?? "",
    callsign: deputy?.callsign ?? "",
    division: deputy?.divisionId ?? "",
    badgeNumber: deputy?.badgeNumber ?? "",
  };

  return (
    <Modal
      title={deputy ? t("Ems.editDeputy") : t("Ems.createDeputy")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageDeputy)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField label={t("Ems.deputyName")}>
              <Input
                value={values.name}
                hasError={!!errors.name}
                id="name"
                onChange={handleChange}
              />
              <Error>{errors.name}</Error>
            </FormField>

            <FormField label={t("Leo.badgeNumber")}>
              <Input
                type="number"
                value={values.badgeNumber}
                hasError={!!errors.badgeNumber}
                id="badgeNumber"
                onChange={(e) =>
                  handleChange({
                    ...e,
                    target: {
                      ...e.target,
                      id: "badgeNumber",
                      value: e.target.valueAsNumber,
                    },
                  })
                }
              />
              <Error>{errors.badgeNumber}</Error>
            </FormField>

            <FormField label={t("Leo.callsign")}>
              <Input
                value={values.callsign}
                hasError={!!errors.callsign}
                id="callsign"
                onChange={handleChange}
              />
              <Error>{errors.callsign}</Error>
            </FormField>

            <FormField label={t("Leo.department")}>
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

            <FormField label={t("Leo.division")}>
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
              <Button type="reset" onClick={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {deputy ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
