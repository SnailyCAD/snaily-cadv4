import { Button, Loader } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { useValues } from "context/ValuesContext";
import { Select } from "components/form/Select";
import { FormField } from "components/form/FormField";
import useFetch from "lib/useFetch";
import { useActiveDispatcherState } from "state/dispatch/active-dispatcher-state";
import type { GetDispatchData } from "@snailycad/types/api";
import { useRouter } from "next/router";

export function SelectDepartmentModal() {
  const { closeModal, isOpen } = useModal();
  const { state, execute } = useFetch();

  const { userActiveDispatcher, setUserActiveDispatcher } = useActiveDispatcherState((s) => ({
    setUserActiveDispatcher: s.setUserActiveDispatcher,
    userActiveDispatcher: s.userActiveDispatcher,
  }));

  const { department } = useValues();

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const router = useRouter();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!userActiveDispatcher) return;

    const { json } = await execute<GetDispatchData["userActiveDispatcher"]>({
      path: "/dispatch/active-dispatcher",
      method: "PUT",
      data: { activeDepartment: values.activeDepartment ?? null },
    });

    if (json) {
      router.reload();
      setUserActiveDispatcher(json);
      closeModal(ModalIds.SelectDepartment);
    }
  }

  const INITIAL_VALUES = {
    activeDepartment: userActiveDispatcher?.department?.id ?? null,
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.SelectDepartment)}
      onClose={() => closeModal(ModalIds.SelectDepartment)}
      title={t("selectDepartment")}
      className="w-[600px]"
    >
      <Formik enableReinitialize onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form>
            <FormField errorMessage={errors.activeDepartment} label={t("selectDepartment")}>
              <Select
                name="activeDepartment"
                isClearable
                values={department.values.map((department) => ({
                  label: department.value.value,
                  value: department.id,
                }))}
                required
                autoFocus
                value={values.activeDepartment ?? null}
                onChange={handleChange}
              />
            </FormField>

            <footer className="flex justify-end gap-2">
              <Button
                variant="cancel"
                onPress={() => closeModal(ModalIds.SelectDepartment)}
                className="flex items-center"
                type="reset"
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
  );
}
