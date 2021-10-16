import { useTranslations } from "use-intl";
import { Formik } from "formik";
import { useRouter } from "next/router";
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
import { useCitizen } from "context/CitizenContext";

interface Props {
  weapon: Weapon | null;
  citizens: Citizen[];
  onCreate?: (newV: Weapon) => void;
  onUpdate?: (old: Weapon, newV: Weapon) => void;
  onClose?: () => void;
}

export const RegisterWeaponModal = ({
  citizens = [],
  weapon,
  onClose,
  onCreate,
  onUpdate,
}: Props) => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const { pathname } = useRouter();

  const t = useTranslations("Citizen");
  const tVehicle = useTranslations("Vehicles");
  const common = useTranslations("Common");

  const { citizen } = useCitizen(false);
  const { weapon: weapons, license } = useValues();
  const validate = handleValidate(WEAPON_SCHEMA);
  const isDisabled = pathname === "/citizen/[id]";

  function handleClose() {
    closeModal(ModalIds.RegisterWeapon);
    onClose?.();
  }

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
    model: weapon?.modelId ?? "",
    registrationStatus: weapon?.registrationStatusId ?? "",
    citizenId: isDisabled ? citizen.id : weapon?.citizenId ?? "",
  };

  return (
    <Modal
      title={t("registerWeapon")}
      onClose={handleClose}
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
                  value: weapon.id,
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
                values={
                  isDisabled
                    ? [{ value: citizen.id, label: `${citizen.name} ${citizen.surname}` }]
                    : citizens.map((citizen) => ({
                        label: `${citizen.name} ${citizen.surname}`,
                        value: citizen.id,
                      }))
                }
                value={isDisabled ? citizen.id : values.citizenId}
                name="citizenId"
                onChange={handleChange}
                disabled={isDisabled}
              />
              <Error>{errors.citizenId}</Error>
            </FormField>

            <FormField fieldId="registrationStatus" label={tVehicle("registrationStatus")}>
              <Select
                hasError={!!errors.registrationStatus}
                values={license.values.map((license) => ({
                  label: license.value,
                  value: license.id,
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
                {weapon ? common("save") : t("registerWeapon")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
};
