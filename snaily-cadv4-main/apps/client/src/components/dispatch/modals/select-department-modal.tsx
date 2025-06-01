import { Button, Loader } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { useValues } from "context/ValuesContext";
import useFetch from "lib/useFetch";
import { useActiveDispatcherState } from "state/dispatch/active-dispatcher-state";
import type { GetDispatchData } from "@snailycad/types/api";
import { useRouter } from "next/router";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { ValueType } from "@snailycad/types";

export function SelectDepartmentModal() {
  const modalState = useModal();
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
      modalState.closeModal(ModalIds.SelectDepartment);
    }
  }

  const INITIAL_VALUES = {
    activeDepartment: userActiveDispatcher?.department?.id ?? null,
  };

  return (
    <Modal
      isOpen={modalState.isOpen(ModalIds.SelectDepartment)}
      onClose={() => modalState.closeModal(ModalIds.SelectDepartment)}
      title={t("selectDepartment")}
      className="w-[600px]"
    >
      <Formik enableReinitialize onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ isValid }) => (
          <Form>
            <ValueSelectField
              fieldName="activeDepartment"
              isClearable
              isOptional
              values={department.values}
              label={t("selectDepartment")}
              valueType={ValueType.DEPARTMENT}
            />

            <footer className="flex justify-end gap-2">
              <Button
                variant="cancel"
                onPress={() => modalState.closeModal(ModalIds.SelectDepartment)}
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
