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
import { useValues } from "context/ValuesContext";
import { useDispatchState } from "state/dispatchState";
import { ActiveDeputy } from "state/emsFdState";

interface Props {
  type?: "ems-fd" | "leo";
  unit: ActiveOfficer | ActiveDeputy | null;
  onClose?: () => void;
}

export const ManageUnitModal = ({ type = "leo", unit, onClose }: Props) => {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { codes10 } = useValues();
  const { activeOfficers, setActiveOfficers } = useDispatchState();
  const t = useTranslations("Leo");

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageUnit);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!unit) return;

    if (type === "leo") {
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
        handleClose();
      }
    } else {
      const { json } = await execute(`/ems-fd/${unit.id}/status`, {
        method: "PUT",
        data: { ...values },
      });

      if (json.id) {
        handleClose();
      }
    }
  }

  if (!unit) {
    return null;
  }

  const INITIAL_VALUES = {
    status: unit.status?.id ?? null,
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
            <FormField label={t("status")}>
              <Select
                name="status"
                value={values.status}
                values={codes10.values.map((v) => ({
                  label: v.value.value,
                  value: v.id,
                }))}
                onChange={handleChange}
              />
              <Error>{errors.status}</Error>
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
