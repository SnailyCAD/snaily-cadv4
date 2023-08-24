import type { PostDispatchSignal100Data } from "@snailycad/types/api";
import { Button, Loader, SelectField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useCall911State } from "state/dispatch/call-911-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

export function EnableSignal100Modal() {
  const modalState = useModal();
  const { setCalls, calls } = useCall911State((state) => ({
    setCalls: state.setCalls,
    calls: state.calls,
  }));

  const t = useTranslations();
  const { execute, state } = useFetch();

  const INITIAL_VALUES = {
    call: null,
    value: true,
  };

  async function handleSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostDispatchSignal100Data>({
      path: "/dispatch/signal-100",
      method: "POST",
      data: { value: values.value, callId: values.call },
    });

    if (json) {
      modalState.closeModal(ModalIds.EnableSignal100);

      setCalls(
        calls.map((call) => {
          if (call.id === values.call) {
            return { ...call, isSignal100: true };
          }
          return call;
        }),
      );
    }
  }

  return (
    <Modal
      className="w-[500px]"
      title={t("Leo.enableSignal100")}
      isOpen={modalState.isOpen(ModalIds.EnableSignal100)}
      onClose={() => modalState.closeModal(ModalIds.EnableSignal100)}
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={handleSubmit}>
        {({ setFieldValue, values }) => (
          <Form>
            <SelectField
              isOptional
              label="Call"
              isClearable
              selectedKey={values.call}
              onSelectionChange={(key) => setFieldValue("call", key)}
              options={calls.map((call) => ({
                label: `#${call.caseNumber}`,
                value: call.id,
              }))}
            />

            <footer className="flex items-center justify-end gap-2 mt-5">
              <Button
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.ManageTowCall)}
                variant="cancel"
              >
                {t("Common.cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("Leo.enableSignal100")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
