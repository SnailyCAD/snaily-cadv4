import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useCitizen } from "context/CitizenContext";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { Pencil } from "react-bootstrap-icons";
import { ModalIds } from "types/ModalIds";

interface Props {
  occupation: string | null;
  isLeo?: boolean;
}

export function ManageOccupationModal({ isLeo, occupation }: Props) {
  const { openModal, closeModal, isOpen } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Citizen");
  const { state, execute } = useFetch();
  const { citizen, setCurrentCitizen } = useCitizen(false);

  async function handleSubmit(values: typeof INITIAL_VALUES) {
    const citizenData = {
      name: citizen.name,
      surname: citizen.surname,
      gender: citizen.genderId,
      ethnicity: citizen.ethnicityId,
      dateOfBirth: citizen.dateOfBirth,
      weight: citizen.weight,
      height: citizen.height,
      hairColor: citizen.hairColor,
      eyeColor: citizen.eyeColor,
      address: citizen.address,
    };

    const { json } = await execute(`/citizen/${citizen.id}`, {
      method: "PUT",
      data: { ...citizenData, ...values },
    });

    if (json.id) {
      closeModal(ModalIds.ManageOccupation);
      setCurrentCitizen({ ...citizen, ...values });
    }
  }

  const INITIAL_VALUES = {
    occupation: occupation ?? "",
  };

  return (
    <>
      <p className="flex items-start gap-1">
        <span className="flex items-center gap-1 text-neutral-700 dark:text-gray-300/70">
          {isLeo ? null : (
            <Button
              aria-label={t("manageOccupation")}
              title={t("manageOccupation")}
              onClick={() => openModal(ModalIds.ManageOccupation)}
              variant="default"
              className="px-1.5"
            >
              <Pencil width={18} height={18} />
            </Button>
          )}
          <span className="font-semibold">{t("occupation")}: </span>
        </span>
        <span className="max-w-[400px]">{occupation || common("none")}</span>
      </p>

      {isLeo ? null : (
        <Modal
          title={t("manageOccupation")}
          onClose={() => closeModal(ModalIds.ManageOccupation)}
          isOpen={isOpen(ModalIds.ManageOccupation)}
          className="min-w-[600px]"
        >
          <Formik onSubmit={handleSubmit} initialValues={INITIAL_VALUES}>
            {({ handleChange, isValid, values }) => (
              <Form>
                <FormField label={t("occupation")}>
                  <Textarea
                    className="min-h-[8em]"
                    value={values.occupation}
                    onChange={handleChange}
                    name="occupation"
                  />
                </FormField>

                <footer className="flex items-center justify-end mt-5">
                  <Button
                    type="reset"
                    onClick={() => closeModal(ModalIds.RegisterWeapon)}
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
                    {common("save")}
                  </Button>
                </footer>
              </Form>
            )}
          </Formik>
        </Modal>
      )}
    </>
  );
}
