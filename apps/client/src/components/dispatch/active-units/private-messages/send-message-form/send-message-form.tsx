import * as React from "react";
import type { Call911, DispatchChat, LeoIncident } from "@snailycad/types";
import { Button, Loader, TextField } from "@snailycad/ui";
import { Form, Formik, type FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { AddCallPopover } from "./add-call-popover";
import { AddIncidentPopover } from "./add-incident-popover";
import { useRouter } from "next/router";

interface Props {
  unitId: string;
  onSend?(message: DispatchChat): void;
}

export function SendMessageForm(props: Props) {
  const { state, execute } = useFetch();
  const t = useTranslations("Leo");
  const router = useRouter();
  const isDispatch = router.pathname.includes("/dispatch");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute<DispatchChat, typeof INITIAL_VALUES>({
      path: `/dispatch/private-message/${props.unitId}`,
      method: "POST",
      data: values,
      helpers,
    });

    if (json.id) {
      props.onSend?.(json);
      helpers.resetForm();
    }
  }

  const INITIAL_VALUES = {
    message: "",
    call911Id: null,
    call911: null as Call911 | null,

    incidentId: null,
    incident: null as LeoIncident | null,
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
        <Form className="mt-4">
          <TextField
            autoFocus
            label={t("message")}
            value={values.message}
            onChange={(value) => setFieldValue("message", value)}
            errorMessage={errors.message}
            isTextarea
            onKeyDown={(e) => handleCtrlEnter(e, submitForm)}
            isRequired
          />

          <footer className="flex mt-5 items-center justify-between">
            {isDispatch ? (
              <div className="flex items-center gap-2">
                <AddCallPopover />
                <AddIncidentPopover />
              </div>
            ) : (
              <div />
            )}

            <Button disabled={state === "loading"} className="flex items-center" type="submit">
              {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}
              {t("send")}
            </Button>
          </footer>
        </Form>
      )}
    </Formik>
  );
}
