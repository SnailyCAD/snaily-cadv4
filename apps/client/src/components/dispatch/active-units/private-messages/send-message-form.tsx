import * as React from "react";
import { DispatchChat } from "@snailycad/types";
import { Button, Loader, TextField } from "@snailycad/ui";
import { Form, Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";

interface Props {
  unitId: string;
  onSend?: (message: DispatchChat) => void;
}

export function SendMessageForm(props: Props) {
  const { state, execute } = useFetch();
  const t = useTranslations("Leo");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute<DispatchChat>({
      path: `/dispatch/private-message/${props.unitId}`,
      method: "POST",
      data: values,
    });

    if (json.id) {
      props.onSend?.(json);
      helpers.resetForm();
    }
  }

  const INITIAL_VALUES = {
    message: "",
    // todo: support 911-calls, incidents and searches being sent
  };

  // allow users to press "Enter + Ctrl" or "Enter + Cmd" to send an event
  function handleCtrlEnter(event: React.KeyboardEvent<HTMLTextAreaElement>, submitForm: any) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      submitForm();
    }
  }

  return (
    <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
      {({ values, errors, setFieldValue, submitForm }) => (
        <Form className="mt-20">
          <TextField
            label={t("message")}
            value={values.message}
            onChange={(value) => setFieldValue("message", value)}
            errorMessage={errors.message}
            isTextarea
            onKeyDown={(e) => handleCtrlEnter(e, submitForm)}
          />

          <footer className="flex mt-5 justify-end">
            <Button disabled={state === "loading"} className="flex items-center ml-2" type="submit">
              {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}
              {t("send")}
            </Button>
          </footer>
        </Form>
      )}
    </Formik>
  );
}
