import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { WEAPON_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useValues } from "src/context/ValuesContext";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Citizen, ValueLicenseType, Weapon, WeaponValue } from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { useCitizen } from "context/CitizenContext";
import { Input } from "components/form/inputs/Input";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { filterLicenseTypes } from "lib/utils";
import { toastMessage } from "lib/toastMessage";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import type { NameSearchResult } from "state/search/nameSearchState";

interface Props {
  weapon: (Weapon & { citizen: Citizen }) | null;
  onCreate?(newV: Weapon & { citizen: Citizen }): void;
  onUpdate?(old: Weapon & { citizen: Citizen }, newV: Weapon & { citizen: Citizen }): void;
  onClose?(): void;
}

export function RegisterWeaponModal({ weapon, onClose, onCreate, onUpdate }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const { pathname } = useRouter();
  const { SOCIAL_SECURITY_NUMBERS, CUSTOM_TEXTFIELD_VALUES } = useFeatureEnabled();

  const t = useTranslations("Citizen");
  const tVehicle = useTranslations("Vehicles");
  const tWeapon = useTranslations("Weapons");
  const common = useTranslations("Common");

  const { citizen } = useCitizen(false);
  const { weapon: weapons, license } = useValues();
  const validate = handleValidate(WEAPON_SCHEMA);
  const isDisabled = pathname === "/citizen/[id]";
  const isLeo = pathname.includes("/officer");

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
        toastMessage({
          title: common("success"),
          message: tWeapon("successWeaponRegistered"),
          icon: "success",
        });
        onCreate?.(json);
      }
    }
  }

  const INITIAL_VALUES = {
    model: weapon?.modelId ?? "",
    modelName: weapon?.model.value.value ?? "",
    registrationStatus: weapon?.registrationStatusId ?? "",
    citizenId: isDisabled ? citizen.id : weapon?.citizenId ?? "",
    serialNumber: weapon?.serialNumber ?? "",
    name: isDisabled
      ? `${citizen.name} ${citizen.surname}`
      : weapon
      ? `${weapon.citizen.name} ${weapon.citizen.surname}`
      : "",
  };

  return (
    <Modal
      title={t("registerWeapon")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.RegisterWeapon)}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setValues, errors, values, isValid }) => (
          <Form>
            {CUSTOM_TEXTFIELD_VALUES ? (
              <FormField errorMessage={errors.model} label={tVehicle("model")}>
                <Input
                  list="weaponModelsList"
                  value={values.model}
                  name="model"
                  onChange={handleChange}
                />

                <datalist id="weaponModelsList">
                  {weapons.values.map((weapon) => (
                    <span key={weapon.id}>{weapon.value.value}</span>
                  ))}
                </datalist>
              </FormField>
            ) : (
              <FormField errorMessage={errors.model} label={tVehicle("model")}>
                <InputSuggestions<WeaponValue>
                  onSuggestionClick={(suggestion) => {
                    setValues({
                      ...values,
                      modelName: suggestion.value.value,
                      model: suggestion.id,
                    });
                  }}
                  Component={({ suggestion }) => (
                    <p className="w-full text-left">{suggestion.value.value}</p>
                  )}
                  options={{
                    apiPath: (value) => `/admin/values/weapon/search?query=${value}`,
                    method: "GET",
                    minLength: 2,
                  }}
                  inputProps={{
                    value: values.modelName,
                    name: "modelName",
                    onChange: handleChange,
                    errorMessage: errors.model,
                  }}
                />
              </FormField>
            )}

            <FormField errorMessage={errors.citizenId} label={tVehicle("owner")}>
              <InputSuggestions<NameSearchResult>
                onSuggestionClick={(suggestion) => {
                  setValues({
                    ...values,
                    citizenId: suggestion.id,
                    name: `${suggestion.name} ${suggestion.surname}`,
                  });
                }}
                Component={({ suggestion }) => (
                  <div className="flex items-center">
                    <p>
                      {suggestion.name} {suggestion.surname}{" "}
                      {SOCIAL_SECURITY_NUMBERS && suggestion.socialSecurityNumber ? (
                        <>(SSN: {suggestion.socialSecurityNumber})</>
                      ) : null}
                    </p>
                  </div>
                )}
                options={{
                  apiPath: `/search/name${isLeo ? "" : "?fromAuthUserOnly=true"}`,
                  method: "POST",
                  dataKey: "name",
                  allowUnknown: isLeo,
                }}
                inputProps={{
                  value: values.name,
                  name: "name",
                  onChange: handleChange,
                  disabled: isDisabled,
                  errorMessage: errors.citizenId,
                }}
              />
            </FormField>

            <FormField
              errorMessage={errors.registrationStatus}
              label={tVehicle("registrationStatus")}
            >
              <Select
                values={filterLicenseTypes(
                  license.values,
                  ValueLicenseType.REGISTRATION_STATUS,
                ).map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.registrationStatus}
                name="registrationStatus"
                onChange={handleChange}
              />
            </FormField>

            <FormField optional errorMessage={errors.serialNumber} label={tWeapon("serialNumber")}>
              <Input value={values.serialNumber} name="serialNumber" onChange={handleChange} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
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
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
