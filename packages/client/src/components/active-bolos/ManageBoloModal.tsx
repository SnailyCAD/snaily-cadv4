import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { BoloType, Citizen, RegisteredVehicle } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { CREATE_BOLO_SCHEMA } from "@snailycad/schemas";
import { FullBolo, useDispatchState } from "state/dispatchState";
import { Person, PersonFill, ThreeDots } from "react-bootstrap-icons";
import { FormRow } from "components/form/FormRow";
import { classNames } from "lib/classNames";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { useImageUrl } from "hooks/useImageUrl";
import { useSSRSafeId } from "@react-aria/ssr";

interface Props {
  onClose?(): void;
  bolo: FullBolo | null;
}

export function ManageBoloModal({ onClose, bolo }: Props) {
  const common = useTranslations("Common");
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { bolos, setBolos } = useDispatchState();
  const { makeImageUrl } = useImageUrl();
  const t = useTranslations("Bolos");
  const leo = useTranslations("Leo");

  const personTypeId = useSSRSafeId();
  const vehicleTypeId = useSSRSafeId();
  const otherTypeId = useSSRSafeId();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (bolo) {
      const { json } = await execute(`/bolos/${bolo.id}`, {
        method: "PUT",
        data: values,
      });

      if (json.id) {
        setBolos(
          bolos.map((v) => {
            if (v.id === json.id) {
              return json;
            }

            return v;
          }),
        );
        closeModal(ModalIds.ManageBolo);
      }
    } else {
      const { json } = await execute("/bolos", {
        method: "POST",
        data: values,
      });

      if (json.id) {
        setBolos([json, ...bolos]);
        closeModal(ModalIds.ManageBolo);
      }
    }
  }

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageBolo);
  }

  const validate = handleValidate(CREATE_BOLO_SCHEMA);
  const INITIAL_VALUES = {
    type: bolo?.type ?? BoloType.PERSON,
    name: bolo?.name ?? "",
    plate: bolo?.plate ?? "",
    color: bolo?.color ?? "",
    description: bolo?.description ?? "",
    model: bolo?.model ?? "",
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.ManageBolo)}
      onClose={handleClose}
      title={bolo ? t("editBolo") : t("createBolo")}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setFieldValue, values, errors, isValid }) => (
          <Form autoComplete="off">
            <FormField errorMessage={errors.type} label={common("type")}>
              <FormRow>
                <Button
                  disabled={!!bolo}
                  onClick={() => setFieldValue("type", BoloType.PERSON)}
                  variant={values.type === BoloType.PERSON ? "blue" : "default"}
                  className={classNames("flex justify-center")}
                  type="button"
                  title="Person type"
                  aria-label="Person Type"
                  id={personTypeId}
                >
                  <Person aria-labelledby={personTypeId} width={30} height={30} />
                </Button>
                <Button
                  disabled={!!bolo}
                  onClick={() => setFieldValue("type", BoloType.VEHICLE)}
                  variant={values.type === BoloType.VEHICLE ? "blue" : "default"}
                  className={classNames("flex justify-center")}
                  type="button"
                  title="Vehicle type"
                  aria-label="Vehicle Type"
                  id={vehicleTypeId}
                >
                  <svg
                    aria-labelledby={vehicleTypeId}
                    width={30}
                    height={30}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 50 50"
                    fill="white"
                  >
                    <path d="M 8.59375 9 C 6.707031 9 4.972656 10.0625 4.125 11.75 L 0.75 18.5 L 0.6875 18.59375 L 0.71875 18.59375 C 0.269531 19.359375 0 20.234375 0 21.125 L 0 32.3125 C 0 33.789063 1.210938 35 2.6875 35 L 4.09375 35 C 4.570313 37.835938 7.035156 40 10 40 C 12.964844 40 15.429688 37.835938 15.90625 35 L 34.09375 35 C 34.570313 37.835938 37.035156 40 40 40 C 42.964844 40 45.429688 37.835938 45.90625 35 L 47 35 C 48.644531 35 50 33.644531 50 32 L 50 25.375 C 50 22.9375 48.214844 20.871094 45.8125 20.46875 L 37.5 19.0625 L 30.53125 10.78125 C 29.582031 9.652344 28.191406 9 26.71875 9 Z M 8.59375 11 L 18 11 L 18 19 L 2.71875 19 L 5.90625 12.65625 C 6.417969 11.640625 7.457031 11 8.59375 11 Z M 20 11 L 26.71875 11 C 27.605469 11 28.429688 11.386719 29 12.0625 L 34.84375 19 L 20 19 Z M 2 21 L 36.84375 21 L 45.5 22.4375 C 46.953125 22.679688 48 23.902344 48 25.375 L 48 32 C 48 32.554688 47.554688 33 47 33 L 45.90625 33 C 45.429688 30.164063 42.964844 28 40 28 C 37.035156 28 34.570313 30.164063 34.09375 33 L 15.90625 33 C 15.429688 30.164063 12.964844 28 10 28 C 7.035156 28 4.570313 30.164063 4.09375 33 L 2.6875 33 C 2.292969 33 2 32.707031 2 32.3125 L 2 21.125 C 2 21.082031 2 21.042969 2 21 Z M 10 30 C 12.222656 30 14 31.777344 14 34 C 14 36.222656 12.222656 38 10 38 C 7.777344 38 6 36.222656 6 34 C 6 31.777344 7.777344 30 10 30 Z M 40 30 C 42.222656 30 44 31.777344 44 34 C 44 36.222656 42.222656 38 40 38 C 37.777344 38 36 36.222656 36 34 C 36 31.777344 37.777344 30 40 30 Z" />
                  </svg>
                </Button>
                <Button
                  disabled={!!bolo}
                  onClick={() => setFieldValue("type", BoloType.OTHER)}
                  variant={values.type === BoloType.OTHER ? "blue" : "default"}
                  className={classNames("flex justify-center")}
                  type="button"
                  title="Other type"
                  aria-label="Other Type"
                  id={otherTypeId}
                >
                  <ThreeDots aria-labelledby={otherTypeId} width={30} height={30} />
                </Button>
              </FormRow>
            </FormField>

            {values.type === BoloType.VEHICLE ? (
              <>
                <FormField optional errorMessage={errors.plate} label={leo("plate")}>
                  <InputSuggestions
                    inputProps={{
                      id: "plate",
                      onChange: handleChange,
                      value: values.plate,
                    }}
                    options={{
                      apiPath: "/search/vehicle?includeMany=true",
                      method: "POST",
                      dataKey: "plateOrVin",
                    }}
                    onSuggestionClick={(suggestion: RegisteredVehicle) => {
                      setFieldValue("plate", suggestion.plate);
                      setFieldValue("model", suggestion.model.value.value);
                      setFieldValue("color", suggestion.color);
                    }}
                    Component={({ suggestion }: { suggestion: RegisteredVehicle }) => (
                      <p>
                        {suggestion.plate.toUpperCase()} (
                        {suggestion.model.value.value.toUpperCase()})
                      </p>
                    )}
                  />
                </FormField>

                <FormField optional errorMessage={errors.model} label={leo("model")}>
                  <Input name="model" onChange={handleChange} value={values.model} />
                </FormField>

                <FormField optional errorMessage={errors.color} label={leo("color")}>
                  <Input name="color" onChange={handleChange} value={values.color} />
                </FormField>
              </>
            ) : null}

            {values.type === BoloType.PERSON ? (
              <FormField optional errorMessage={errors.name} label={common("name")}>
                <InputSuggestions
                  inputProps={{
                    id: "name",
                    onChange: handleChange,
                    value: values.name,
                    autoComplete: "false",
                    autoCorrect: "false",
                    list: "null",
                  }}
                  options={{
                    apiPath: "/search/name?includeMany=true",
                    method: "POST",
                    dataKey: "name",
                    minLength: 2,
                  }}
                  onSuggestionClick={(suggestion: Citizen) => {
                    setFieldValue("name", `${suggestion.name} ${suggestion.surname}`);
                  }}
                  Component={({ suggestion }: { suggestion: Citizen }) => (
                    <div className="flex items-center">
                      <div className="mr-2 min-w-[25px]">
                        {suggestion.imageId ? (
                          <img
                            className="rounded-md w-[35px] h-[35px] object-cover"
                            draggable={false}
                            src={makeImageUrl("citizens", suggestion.imageId)}
                          />
                        ) : (
                          <PersonFill className="text-gray-500/60 w-[25px] h-[25px]" />
                        )}
                      </div>
                      <p>
                        {suggestion.name} {suggestion.surname}
                      </p>
                    </div>
                  )}
                />
              </FormField>
            ) : null}

            <FormField errorMessage={errors.description} label={common("description")}>
              <Textarea name="description" onChange={handleChange} value={values.description} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {bolo ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
