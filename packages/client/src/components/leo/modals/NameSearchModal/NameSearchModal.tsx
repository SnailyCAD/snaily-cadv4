import * as React from "react";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik, useFormikContext } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Input } from "components/form/Input";
import { Citizen, RegisteredVehicle, Weapon } from "types/prisma";
import { calculateAge } from "lib/utils";
import format from "date-fns/format";
import { VehiclesAndWeaponsSection } from "./VehiclesAndWeapons";
import { FullRecord, RecordsArea } from "./RecordsArea";

const enum Toggled {
  VEHICLES,
  RECORDS,
}

const AutoSubmit = () => {
  const { getPayload } = useModal();
  const payloadName = getPayload<Citizen>(ModalIds.NameSearch)?.name;
  const { submitForm } = useFormikContext();

  // if there's a name, auto-submit the form.
  React.useEffect(() => {
    if (payloadName) {
      submitForm();
    }
  }, [payloadName, submitForm]);

  return null;
};

export const NameSearchModal = () => {
  const { isOpen, closeModal, getPayload } = useModal();
  const common = useTranslations("Common");
  const cT = useTranslations("Citizen");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();

  const [toggled, setToggled] = React.useState<Toggled | null>(null);
  const [results, setResults] = React.useState<NameSearchResult | null | boolean>(null);

  const payloadName = getPayload<Citizen>(ModalIds.NameSearch)?.name;

  React.useEffect(() => {
    if (!isOpen(ModalIds.NameSearch)) {
      setResults(null);
    }
  }, [isOpen]);

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/search/name", {
      method: "POST",
      data: values,
    });

    if (json.id) {
      setResults(json);
    } else {
      setResults(false);
    }
  }

  function handleToggle(toggle: Toggled) {
    if (toggle === toggled) {
      setToggled(null);
    } else {
      setToggled(toggle);
    }
  }

  const INITIAL_VALUES = {
    name: payloadName ?? "",
  };

  return (
    <Modal
      title={t("nameSearch")}
      onClose={() => closeModal(ModalIds.NameSearch)}
      isOpen={isOpen(ModalIds.NameSearch)}
      className="min-w-[850px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField label={cT("fullName")} fieldId="name">
              <Input
                value={values.name}
                hasError={!!errors.name}
                id="name"
                onChange={handleChange}
              />
              <Error>{errors.name}</Error>
            </FormField>

            {typeof results === "boolean" && results !== null ? <p>{t("nameNotFound")}</p> : null}

            {typeof results !== "boolean" && results ? (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>
                <div className="flex">
                  <div className="w-full">
                    <div className="mt-2 flex flex-col">
                      <p>
                        <span className="font-semibold">{cT("fullName")}: </span>
                        {results.name} {results.surname}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("dateOfBirth")}: </span>
                        {format(new Date(results.dateOfBirth), "yyyy-MM-dd")} ({cT("age")}:{" "}
                        {calculateAge(results.dateOfBirth)})
                      </p>
                      <p>
                        <span className="font-semibold">{cT("gender")}: </span>
                        {results.gender.value}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("ethnicity")}: </span>
                        {results.ethnicity.value}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("hairColor")}: </span>
                        {results.hairColor}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("eyeColor")}: </span>
                        {results.eyeColor}
                      </p>
                    </div>

                    <div className="flex flex-col">
                      <p>
                        <span className="font-semibold">{cT("weight")}: </span>
                        {results.weight}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("height")}: </span>
                        {results.height}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("address")}: </span>
                        {results.address}
                      </p>
                    </div>
                  </div>

                  <div className="w-full">
                    <ul className="flex flex-col">
                      <li>
                        <span className="font-semibold">{cT("driversLicense")}: </span>
                        {results.driversLicense?.value ?? common("none")}
                      </li>
                      <li>
                        <span className="font-semibold">{cT("weaponLicense")}: </span>
                        {results.weaponLicense?.value ?? common("none")}
                      </li>
                      <li>
                        <span className="font-semibold">{cT("pilotLicense")}: </span>
                        {results.pilotLicense?.value ?? common("none")}
                      </li>
                      <li>
                        <span className="font-semibold">{cT("ccw")}: </span>
                        {results.ccw?.value ?? common("none")}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleToggle(Toggled.VEHICLES)}
                      type="button"
                      className="w-full"
                    >
                      {"Toggle vehicles and weapons"}
                    </Button>
                    <Button
                      onClick={() => handleToggle(Toggled.RECORDS)}
                      type="button"
                      className="w-full"
                    >
                      {"Toggle records"}
                    </Button>
                  </div>

                  <>
                    {toggled === Toggled.VEHICLES ? (
                      <VehiclesAndWeaponsSection
                        vehicles={results.vehicles}
                        weapons={results.weapons}
                      />
                    ) : null}

                    {toggled === Toggled.RECORDS ? <RecordsArea records={results.Record} /> : null}
                  </>
                </div>
              </div>
            ) : null}

            <footer className="mt-5 flex justify-end">
              <Button type="reset" onClick={() => closeModal(ModalIds.NameSearch)} variant="cancel">
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

            <AutoSubmit />
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

interface NameSearchResult extends Citizen {
  vehicles: RegisteredVehicle[];
  weapons: Weapon[];
  Record: FullRecord[];
}
