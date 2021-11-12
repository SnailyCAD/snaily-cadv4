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
import { Citizen, RecordType } from "types/prisma";
import { calculateAge } from "lib/utils";
import format from "date-fns/format";
import { VehiclesAndWeaponsSection } from "./VehiclesAndWeapons";
import { RecordsArea } from "./RecordsArea";
import { useNameSearch } from "state/nameSearchState";
import { normalizeValue } from "context/ValuesContext";
import { useRouter } from "next/router";
import { PersonFill } from "react-bootstrap-icons";
import { useImageUrl } from "hooks/useImageUrl";
import { useAuth } from "context/AuthContext";

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
  const router = useRouter();
  const { makeImageUrl } = useImageUrl();
  const { cad } = useAuth();

  const { openModal } = useModal();
  const isLeo = router.pathname === "/officer";
  const [toggled, setToggled] = React.useState<Toggled | null>(null);
  const { results, currentResult, setCurrentResult, setResults } = useNameSearch();

  const payloadName = getPayload<Citizen>(ModalIds.NameSearch)?.name;

  React.useEffect(() => {
    if (!isOpen(ModalIds.NameSearch)) {
      setResults(null);
      setToggled(null);
      setCurrentResult(null);
    }
  }, [isOpen, setCurrentResult, setResults]);

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/search/name", {
      method: "POST",
      data: values,
    });

    if (Array.isArray(json) && json.length <= 0) {
      setResults(false);
      return;
    }

    if (json && typeof json !== "boolean") {
      setResults(Array.isArray(json) ? json : [json]);
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

  function handleOpenCreateRecord(type: RecordType) {
    if (!currentResult) return;

    const modalId = {
      [RecordType.ARREST_REPORT]: ModalIds.CreateArrestReport,
      [RecordType.TICKET]: ModalIds.CreateTicket,
      [RecordType.WRITTEN_WARNING]: ModalIds.CreateWrittenWarning,
    };

    openModal(modalId[type], {
      citizenName: `${currentResult.name} ${currentResult.surname}`,
      citizenId: currentResult.id,
    });
  }

  const hasWarrants =
    (currentResult?.warrants.filter((v) => v.status === "ACTIVE").length ?? 0) > 0;
  const INITIAL_VALUES = {
    name: payloadName ?? "",
  };

  return (
    <Modal
      title={t("nameSearch")}
      onClose={() => closeModal(ModalIds.NameSearch)}
      isOpen={isOpen(ModalIds.NameSearch)}
      className="w-[850px]"
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

            {typeof results === "boolean" ? <p>{t("nameNotFound")}</p> : null}

            {Array.isArray(results) && !currentResult ? (
              <ul className="space-y-2">
                {results.map((result) => (
                  <li className="flex items-center justify-between" key={result.id}>
                    <div className="flex items-center">
                      <div className="mr-2 min-w-[50px]">
                        {result.imageId ? (
                          <img
                            className="rounded-md w-[50px] h-[50px] object-cover"
                            draggable={false}
                            src={makeImageUrl("citizens", result.imageId)}
                          />
                        ) : (
                          <PersonFill className="text-gray-500/60 w-[50px] h-[50px]" />
                        )}
                      </div>
                      <p>
                        {result.name} {result.surname}
                      </p>
                    </div>

                    <Button type="button" onClick={() => setCurrentResult(result)}>
                      {common("view")}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}

            {typeof results !== "boolean" && currentResult ? (
              <div className="mt-3">
                <header className="flex justify-between mb-3">
                  <h3 className="text-2xl font-semibold">{t("results")}</h3>

                  <div>
                    <Button type="button" onClick={() => setCurrentResult(null)}>
                      {t("viewAllResults")}
                    </Button>
                  </div>
                </header>

                {currentResult?.dead && currentResult?.dateOfDead ? (
                  <div className="p-2 mt-2 font-semibold bg-yellow-500 rounded-md">
                    {t("citizenDead", {
                      date: format(
                        new Date(currentResult.dateOfDead ?? new Date()),
                        "MMMM do yyyy",
                      ),
                    })}
                  </div>
                ) : null}

                {hasWarrants ? (
                  <div className="p-2 mt-2 font-semibold bg-red-500 rounded-md">
                    {t("hasWarrants")}
                  </div>
                ) : null}

                <div className="flex">
                  <div className="mr-2 min-w-[100px]">
                    {currentResult.imageId ? (
                      <img
                        className="rounded-full w-[100px] h-[100px] object-cover"
                        draggable={false}
                        src={makeImageUrl("citizens", currentResult.imageId)}
                      />
                    ) : (
                      <PersonFill className="text-gray-500/60 w-[100px] h-[100px]" />
                    )}
                  </div>
                  <div className="w-full">
                    <div className="flex flex-col">
                      <p>
                        <span className="font-semibold">{cT("fullName")}: </span>
                        {currentResult.name} {currentResult.surname}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("dateOfBirth")}: </span>
                        {format(new Date(currentResult.dateOfBirth), "yyyy-MM-dd")} ({cT("age")}:{" "}
                        {calculateAge(currentResult.dateOfBirth)})
                      </p>
                      <p>
                        <span className="font-semibold">{cT("gender")}: </span>
                        {currentResult.gender.value}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("ethnicity")}: </span>
                        {currentResult.ethnicity.value}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("hairColor")}: </span>
                        {currentResult.hairColor}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("eyeColor")}: </span>
                        {currentResult.eyeColor}
                      </p>
                    </div>

                    <div className="flex flex-col">
                      <p>
                        <span className="font-semibold">{cT("weight")}: </span>
                        {currentResult.weight} {cad?.miscCadSettings.weightPrefix}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("height")}: </span>
                        {currentResult.height} {cad?.miscCadSettings.heightPrefix}
                      </p>
                      <p>
                        <span className="font-semibold">{cT("address")}: </span>
                        {currentResult.address}
                      </p>
                    </div>
                  </div>

                  <div className="w-full">
                    <ul className="flex flex-col">
                      <li>
                        <span className="font-semibold">{cT("driversLicense")}: </span>
                        {currentResult.driversLicense?.value ?? common("none")}
                      </li>
                      <li>
                        <span className="font-semibold">{cT("weaponLicense")}: </span>
                        {currentResult.weaponLicense?.value ?? common("none")}
                      </li>
                      <li>
                        <span className="font-semibold">{cT("pilotLicense")}: </span>
                        {currentResult.pilotLicense?.value ?? common("none")}
                      </li>
                      <li>
                        <span className="font-semibold">{cT("ccw")}: </span>
                        {currentResult.ccw?.value ?? common("none")}
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
                      {t("toggleVehiclesWeapons")}
                    </Button>
                    <Button
                      onClick={() => handleToggle(Toggled.RECORDS)}
                      type="button"
                      className="w-full"
                    >
                      {t("toggleRecords")}
                    </Button>
                  </div>

                  <>
                    {toggled === Toggled.VEHICLES ? (
                      <VehiclesAndWeaponsSection
                        vehicles={currentResult.vehicles}
                        weapons={currentResult.weapons}
                      />
                    ) : null}

                    {toggled === Toggled.RECORDS ? (
                      <RecordsArea records={currentResult.Record} />
                    ) : null}
                  </>
                </div>
              </div>
            ) : null}

            <footer
              className={`mt-4 pt-3 flex ${
                currentResult && isLeo ? "justify-between" : "justify-end"
              }`}
            >
              {currentResult && isLeo ? (
                <div>
                  {Object.values(RecordType).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      onClick={() => handleOpenCreateRecord(type)}
                      variant="cancel"
                      className="px-1.5"
                    >
                      {t(normalizeValue(`CREATE_${type}`))}
                    </Button>
                  ))}
                </div>
              ) : null}

              <div className="flex">
                <Button
                  type="reset"
                  onClick={() => closeModal(ModalIds.NameSearch)}
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
              </div>
            </footer>

            <AutoSubmit />
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
