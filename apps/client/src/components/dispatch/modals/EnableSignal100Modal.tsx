import type { PostDispatchSignal100Data } from "@snailycad/types/api";
import { Button, Loader } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useCall911State } from "state/dispatch/call-911-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { shallow } from "zustand/shallow";

export function EnableSignal100Modal() {
  const { isOpen, closeModal } = useModal();
  const { setCalls, calls } = useCall911State(
    (state) => ({
      setCalls: state.setCalls,
      calls: state.calls,
    }),
    shallow,
  );

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
      closeModal(ModalIds.EnableSignal100);

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
      isOpen={isOpen(ModalIds.EnableSignal100)}
      onClose={() => closeModal(ModalIds.EnableSignal100)}
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={handleSubmit}>
        {({ handleChange, values }) => (
          <Form>
            <FormField optional label="Call">
              <Select
                onChange={handleChange}
                name="call"
                value={values.call}
                values={calls.map((call) => ({
                  label: `#${call.caseNumber}`,
                  value: call.id,
                }))}
              />
            </FormField>

            <footer className="flex items-center justify-end gap-2 mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.ManageTowCall)}
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
