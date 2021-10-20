import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { Input } from "components/form/Input";
import { FormField } from "components/form/FormField";
import { Error } from "components/form/Error";
import { Textarea } from "components/form/Textarea";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { Full911Call, useDispatchState } from "state/dispatchState";
import { useRouter } from "next/router";
import { useAuth } from "context/AuthContext";
import { Select, SelectValue } from "components/form/Select";

interface Props {
  call: Full911Call | null;
  onClose?: () => void;
}

export const Manage911CallModal = ({ call, onClose }: Props) => {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { setCalls, calls } = useDispatchState();
  const router = useRouter();
  const { user } = useAuth();
  const isDispatch = router.pathname === "/dispatch" && user?.isDispatch;
  const { allOfficers } = useDispatchState();

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.Manage911Call);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (call) {
      const { json } = await execute(`/911-calls/${call.id}`, {
        method: "PUT",
        data: { ...values, assignedUnits: values.assignedUnits.map(({ value }) => value) },
      });

      if (json.id) {
        setCalls(
          calls.map((c) => {
            if (c.id === json.id) {
              return json;
            }

            return c;
          }),
        );
        closeModal(ModalIds.Manage911Call);
      }
    } else {
      const { json } = await execute("/911-calls", {
        method: "POST",
        data: values,
      });

      if (json.id) {
        setCalls([json, ...calls]);
        closeModal(ModalIds.Manage911Call);
      }
    }
  }

  const INITIAL_VALUES = {
    name: call?.name ?? "",
    location: call?.location ?? "",
    description: call?.description ?? "",
    assignedUnits:
      call?.assignedUnits.map((officer) => ({
        label: makeLabel(officer.id),
        value: officer.id,
      })) ?? ([] as SelectValue[]),
  };

  function makeLabel(value: string) {
    // todo: replace with all officers;
    const officer = allOfficers.find((v) => v.id === value);
    return `${officer?.callsign} ${officer?.name} (${officer?.department?.value})`;
  }

  return (
    <Modal
      isOpen={isOpen(ModalIds.Manage911Call)}
      onClose={handleClose}
      title={"Manage 911 Call"}
      className="min-w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form>
            <FormField label="name">
              <Input id="name" value={values.name} onChange={handleChange} />
              <Error>{errors.name}</Error>
            </FormField>

            <FormField label="location">
              <Input id="location" value={values.location} onChange={handleChange} />
              <Error>{errors.location}</Error>
            </FormField>

            <FormField label="description">
              <Textarea
                id="description"
                className="min-h-[5em]"
                value={values.description}
                onChange={handleChange}
              />
              <Error>{errors.description}</Error>
            </FormField>

            {isDispatch ? (
              <FormField label="assignedUnits">
                <Select
                  isMulti
                  name="assignedUnits"
                  value={values.assignedUnits.map((value) => ({
                    label: makeLabel(value.value),
                    value: value.value,
                  }))}
                  values={allOfficers.map((officer) => ({
                    label: `${officer.callsign} ${officer.name} (${officer.department?.value})`,
                    value: officer.id,
                  }))}
                  onChange={handleChange}
                />
                <Error>{errors.assignedUnits}</Error>
              </FormField>
            ) : null}

            <footer className="mt-5 flex justify-end">
              <Button onClick={handleClose} type="button" variant="cancel">
                {common("cancel")}
              </Button>
              <Button className="ml-2 flex items-center" type="submit">
                {state === "loading" ? <Loader className="border-red-200 mr-2" /> : null}

                {call ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
