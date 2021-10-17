import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Select } from "components/form/Select";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { BoloType } from "types/prisma";
import { useTranslations } from "use-intl";
import { CREATE_BOLO_SCHEMA } from "@snailycad/schemas";
import { FullBolo, useDispatchState } from "state/dispatchState";

interface Props {
  onClose?: () => void;
  bolo: FullBolo | null;
}

const labels = {
  PERSON: "Person",
  VEHICLE: "Vehicle",
  OTHER: "Other",
};

const TYPE_VALUES = Object.values(BoloType).map((value) => ({
  label: labels[value],
  value,
}));

export const ManageBoloModal = ({ onClose, bolo }: Props) => {
  const common = useTranslations("Common");
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { bolos, setBolos } = useDispatchState();

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
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.ManageBolo)}
      onClose={handleClose}
      title={bolo ? "Edit Bolo" : "Create bolo"}
      className="min-w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form>
            <FormField label={"Type"}>
              <Select
                disabled={!!bolo}
                name="type"
                onChange={handleChange}
                hasError={!!errors.type}
                value={values.type}
                values={TYPE_VALUES}
              />
              <Error>{errors.type}</Error>
            </FormField>

            {values.type === BoloType.VEHICLE ? (
              <>
                <FormField label={"Plate"}>
                  <Input
                    id="plate"
                    onChange={handleChange}
                    hasError={!!errors.plate}
                    value={values.plate}
                  />
                  <Error>{errors.plate}</Error>
                </FormField>

                <FormField label={"Color"}>
                  <Input
                    id="color"
                    onChange={handleChange}
                    hasError={!!errors.color}
                    value={values.color}
                  />
                  <Error>{errors.color}</Error>
                </FormField>
              </>
            ) : null}

            {values.type === BoloType.PERSON ? (
              <FormField label={"Name"}>
                <Input
                  id="name"
                  onChange={handleChange}
                  hasError={!!errors.name}
                  value={values.name}
                />
                <Error>{errors.name}</Error>
              </FormField>
            ) : null}

            <FormField label={"Description"}>
              <Textarea
                id="description"
                onChange={handleChange}
                hasError={!!errors.description}
                value={values.description}
              />
              <Error>{errors.description}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
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
};
