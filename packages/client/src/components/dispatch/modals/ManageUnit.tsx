import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { FormField } from "components/form/FormField";
import { Error } from "components/form/Error";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { Select } from "components/form/Select";
import { ActiveOfficer } from "state/leoState";
import { StatusEnum } from "types/prisma";
import { useValues } from "context/ValuesContext";
import { useDispatchState } from "state/dispatchState";

interface Props {
  unit: ActiveOfficer | null;
  onClose?: () => void;
}

const labels = {
  ON_DUTY: "On Duty",
  OFF_DUTY: "Off Duty",
};

const STATUS_VALUES = Object.values(StatusEnum).map((v) => ({
  value: v,
  label: labels[v],
}));

export const ManageUnitModal = ({ unit, onClose }: Props) => {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { codes10 } = useValues();
  const { activeOfficers, setActiveOfficers } = useDispatchState();

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageUnit);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!unit) return;

    if ("departmentId" in unit) {
      const { json } = await execute(`/leo/${unit.id}/status`, {
        method: "PUT",
        data: { ...values },
      });

      if (json.id) {
        setActiveOfficers(
          activeOfficers.map((officer) => {
            if (officer.id === json.id) {
              return { ...officer, ...json };
            }

            return officer;
          }),
        );
        closeModal(ModalIds.ManageUnit);
      }
    }
  }

  if (!unit) {
    return null;
  }

  const INITIAL_VALUES = {
    status: unit.status,
    status2: unit.status2?.value?.value ?? null,
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.ManageUnit)}
      onClose={handleClose}
      title={`${common("manage")} ${unit.callsign} ${unit.name}`}
      className="min-w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form>
            <FormField label="Status">
              <Select
                name="status"
                value={values.status}
                values={STATUS_VALUES}
                onChange={handleChange}
              />
              <Error>{errors.status}</Error>
            </FormField>

            <FormField label="Status2">
              <Select
                name="status2"
                value={values.status2}
                values={codes10.values.map((v) => ({
                  label: v.value.value,
                  value: v.value.value,
                }))}
                onChange={handleChange}
              />
              <Error>{errors.status2}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button onClick={handleClose} type="button" variant="cancel">
                {common("cancel")}
              </Button>
              <Button className="ml-2 flex items-center" type="submit">
                {state === "loading" ? <Loader className="border-red-200 mr-2" /> : null}

                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
