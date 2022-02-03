import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Input } from "components/form/inputs/Input";
import type { Citizen, Value, ValueType, Weapon } from "@snailycad/types";
import { Infofield } from "components/shared/Infofield";

export function WeaponSearchModal() {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const wT = useTranslations("Weapons");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();

  const [results, setResults] = React.useState<WeaponSearchResult | null | boolean>(null);

  React.useEffect(() => {
    if (!isOpen(ModalIds.WeaponSearch)) {
      setResults(null);
    }
  }, [isOpen]);

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/search/weapon", {
      method: "POST",
      data: values,
      noToast: true,
    });

    if (json.id) {
      setResults(json);
    } else {
      setResults(false);
    }
  }

  const INITIAL_VALUES = {
    serialNumber: "",
  };

  return (
    <Modal
      title={t("weaponSearch")}
      onClose={() => closeModal(ModalIds.WeaponSearch)}
      isOpen={isOpen(ModalIds.WeaponSearch)}
      className="w-[750px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.serialNumber} label={t("serialNumber")}>
              <Input value={values.serialNumber} name="serialNumber" onChange={handleChange} />
            </FormField>

            {typeof results === "boolean" ? <p>{t("weaponNotFound")}</p> : null}

            {typeof results !== "boolean" && results ? (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>

                <ul className="mt-2">
                  <li>
                    <Infofield label={wT("model")}>{results.model.value.value}</Infofield>
                  </li>
                  <li>
                    <Infofield label={wT("registrationStatus")}>
                      {results.registrationStatus.value}
                    </Infofield>
                  </li>
                  <li>
                    <Infofield label={wT("serialNumber")}>{results.serialNumber}</Infofield>
                  </li>
                  <li>
                    <Infofield className="capitalize" label={t("owner")}>
                      {results.citizen.name} {results.citizen.surname}
                    </Infofield>
                  </li>
                </ul>
              </div>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.WeaponSearch)}
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
                {common("search")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}

interface WeaponSearchResult extends Weapon {
  citizen: Citizen;
  registrationStatus: Value<ValueType.LICENSE>;
}
