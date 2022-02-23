import type { EmsFdDeputy, Officer } from "@snailycad/types";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";

interface Props {
  unit: Officer | EmsFdDeputy;
  onClose?(): void;
}

export function UnitRadioChannelModal({ unit, onClose }: Props) {
  const { isOpen, closeModal, openModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageUnitRadioChannel);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    console.log({ values });
    const { json } = await execute("", {
      method: "POST",
      data: values,
    });

    console.log({ json });
  }

  const INITIAL_VALUES = {
    radioChannel: unit.radioChannelId ?? "",
  };

  return (
    <>
      <Button onClick={() => openModal(ModalIds.ManageUnitRadioChannel)}>
        {unit.radioChannelId ? unit.radioChannelId : common("none")}
      </Button>

      <Modal
        onClose={handleClose}
        isOpen={isOpen(ModalIds.ManageUnitRadioChannel)}
        title={t("manageRadioChannel")}
        className="min-w-[500px]"
      >
        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ values, errors, handleChange }) => (
            <Form>
              <FormField errorMessage={errors.radioChannel} label={t("radioChannel")}>
                <Input name="radioChannel" onChange={handleChange} value={values.radioChannel} />
              </FormField>

              <footer className="flex mt-5 justify-end">
                <Button onClick={handleClose} type="button" variant="cancel">
                  {common("cancel")}
                </Button>
                <Button className="flex items-center ml-2" type="submit">
                  {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}

                  {common("save")}
                </Button>
              </footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </>
  );
}
