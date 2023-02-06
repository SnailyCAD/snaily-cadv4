import { useTranslations } from "use-intl";
import { Form, Formik, FormikHelpers } from "formik";
import { useRouter } from "next/router";
import { WEAPON_SCHEMA } from "@snailycad/schemas";
import { FormField } from "components/form/FormField";
import { Loader, Input, Button, Item, AsyncListSearchField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useValues } from "src/context/ValuesContext";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import {
  ValueLicenseType,
  ValueType,
  Weapon,
  WeaponValue,
  WhitelistStatus,
} from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { useCitizen } from "context/CitizenContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { filterLicenseType, filterLicenseTypes } from "lib/utils";
import { toastMessage } from "lib/toastMessage";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type { PostCitizenWeaponData, PutCitizenWeaponData } from "@snailycad/types/api";
import { Toggle } from "components/form/Toggle";
import { ValueSelectField } from "components/form/inputs/value-select-field";

interface Props {
  weapon: Omit<Weapon, "citizen"> | null;
  onCreate?(newV: Omit<Weapon, "citizen">): void;
  onUpdate?(old: Omit<Weapon, "citizen">, newV: Omit<Weapon, "citizen">): void;
  onClose?(): void;
}

export function RegisterWeaponModal({ weapon, onClose, onCreate, onUpdate }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const { pathname } = useRouter();
  const { CUSTOM_TEXTFIELD_VALUES } = useFeatureEnabled();

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

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (weapon) {
      const { json } = await execute<PutCitizenWeaponData, typeof INITIAL_VALUES>({
        path: `/weapons/${weapon.id}`,
        method: "PUT",
        data: values,
        helpers,
      });

      if (json?.id) {
        onUpdate?.(weapon, { ...weapon, ...json });
      }
    } else {
      const { json } = await execute<PostCitizenWeaponData, typeof INITIAL_VALUES>({
        path: "/weapons",
        method: "POST",
        data: values,
        helpers,
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
    model: CUSTOM_TEXTFIELD_VALUES ? weapon?.model.value.value ?? "" : weapon?.modelId ?? "",
    modelName: weapon?.model.value.value ?? "",
    registrationStatus: weapon?.registrationStatusId ?? "",
    citizenId: isDisabled ? citizen.id : weapon?.citizenId ?? "",
    serialNumber: weapon?.serialNumber ?? "",
    reApplyForDmv: weapon?.bofStatus === WhitelistStatus.DECLINED ? false : undefined,
    name: isDisabled
      ? `${citizen.name} ${citizen.surname}`
      : weapon
      ? `${(weapon as any).citizen?.name} ${(weapon as any).citizen?.surname}`
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
              <AsyncListSearchField<WeaponValue>
                localValue={values.modelName}
                setValues={({ localValue, node }) => {
                  const modelName =
                    typeof localValue !== "undefined" ? { modelName: localValue } : {};
                  const model = node ? { model: node.key as string } : {};

                  setValues({ ...values, ...modelName, ...model });
                }}
                errorMessage={errors.model}
                label={tVehicle("model")}
                selectedKey={values.model}
                fetchOptions={{
                  apiPath: (value) => `/admin/values/weapon/search?query=${value}`,
                  method: "GET",
                }}
              >
                {(item) => {
                  return <Item textValue={item.value.value}>{item.value.value}</Item>;
                }}
              </AsyncListSearchField>
            )}

            <CitizenSuggestionsField
              allowsCustomValue
              label={tVehicle("owner")}
              fromAuthUserOnly={!isLeo}
              labelFieldName="name"
              valueFieldName="citizenId"
              isDisabled={isDisabled}
            />

            <ValueSelectField
              fieldName="registrationStatus"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.REGISTRATION_STATUS)}
              label={tVehicle("registrationStatus")}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.REGISTRATION_STATUS)}
            />

            <FormField optional errorMessage={errors.serialNumber} label={tWeapon("serialNumber")}>
              <Input value={values.serialNumber} name="serialNumber" onChange={handleChange} />
            </FormField>

            {weapon ? (
              <FormField errorMessage={errors.reApplyForDmv} label={tVehicle("reApplyForDmv")}>
                <Toggle
                  disabled={weapon.bofStatus !== WhitelistStatus.DECLINED}
                  onCheckedChange={handleChange}
                  name="reApplyForDmv"
                  value={values.reApplyForDmv ?? false}
                />
              </FormField>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
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
