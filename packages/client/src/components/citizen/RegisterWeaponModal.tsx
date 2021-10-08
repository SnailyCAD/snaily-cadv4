import { useTranslations } from "use-intl";
import { Formik } from "formik";
import { WEAPON_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useValues } from "src/context/ValuesContext";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Citizen, Weapon } from "types/prisma";
import { handleValidate } from "lib/handleValidate";

interface Props {
  weapon: Weapon | null;
  citizens: Citizen[];
  onCreate?: (newV: Weapon) => void;
  onUpdate?: (old: Weapon, newV: Weapon) => void;
}

export const RegisterWeaponModal = ({ citizens = [], weapon, onCreate, onUpdate }: Props) => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Citizen");
  const tVehicle = useTranslations("Vehicles");

  const { weapons, licenses } = useValues();
  const validate = handleValidate(WEAPON_SCHEMA);

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (weapon) {
      const { json } = await execute(`/weapons/${weapon.id}`, {
        method: "PUT",
        data: values,
      });

      if (json?.id) {
        onUpdate?.(weapon, json);
      }
    } else {
      const { json } = await execute("/weapons", {
        method: "POST",
        data: values,
      });

      if (json?.id) {
        onCreate?.(json);
      }
    }
  }

  const INITIAL_VALUES = {
    model: weapon?.model ?? "",
    registrationStatus: weapon?.registrationStatus ?? "",
    citizenId: weapon?.citizenId ?? "",
  };

  return (
    <Modal
      title={t("registerWeapon")}
      onClose={() => closeModal(ModalIds.RegisterWeapon)}
      isOpen={isOpen(ModalIds.RegisterWeapon)}
      className="min-w-[600px] min-h-[400px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField fieldId="model" label={tVehicle("model")}>
              <Select
                hasError={!!errors.model}
                values={weapons.values.map((weapon) => ({
                  label: weapon.value,
                  value: weapon.value,
                }))}
                value={values.model}
                name="model"
                onChange={handleChange}
              />
              <Error>{errors.model}</Error>
            </FormField>

            <FormField fieldId="citizenId" label={tVehicle("owner")}>
              <Select
                hasError={!!errors.citizenId}
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                value={values.citizenId}
                name="citizenId"
                onChange={handleChange}
              />
              <Error>{errors.citizenId}</Error>
            </FormField>

            <FormField fieldId="registrationStatus" label={tVehicle("registrationStatus")}>
              <Select
                hasError={!!errors.registrationStatus}
                values={licenses.values.map((license) => ({
                  label: license.value,
                  value: license.value,
                }))}
                value={values.registrationStatus}
                name="registrationStatus"
                onChange={handleChange}
              />
              <Error>{errors.registrationStatus}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.RegisterWeapon)}
                variant="cancel"
              >
                Cancel
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("registerWeapon")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
};
