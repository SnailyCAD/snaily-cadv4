import * as React from "react";
import { Form, Formik, FormikHelpers, useFormikContext } from "formik";
import { Button, Loader, TextField } from "@snailycad/ui";
import type { Call911Event, IncidentEvent } from "@snailycad/types";
import { useTranslations } from "next-intl";

interface Props<T extends IncidentEvent | Call911Event> {
  event: T | null;
  setEvent: React.Dispatch<React.SetStateAction<T["id"] | null>>;
  onSubmit(values: { description: string }, helpers: FormikHelpers<{ description: string }>): void;
  state: "loading" | "error" | null;
}

export function UpdateEventForm<T extends IncidentEvent | Call911Event>({
  event,
  state,
  setEvent,
  onSubmit,
}: Props<T>) {
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (event && inputRef.current) {
      inputRef.current.focus();
    }
  }, [event]);

  // allow users to press "Enter + Ctrl" or "Enter + Cmd" to send an event
  function handleCtrlEnter(event: React.KeyboardEvent<HTMLTextAreaElement>, submitForm: any) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      submitForm();
    }
  }

  return (
    <Formik onSubmit={onSubmit} initialValues={{ description: event?.description ?? "" }}>
      {({ setFieldValue, submitForm, values, errors }) => (
        <Form className="md:absolute bottom-0 w-full">
          <TextField
            isTextarea
            errorMessage={errors.description}
            label={common("description")}
            name="description"
            onChange={(value) => setFieldValue("description", value)}
            value={values.description}
            onKeyDown={(e) => handleCtrlEnter(e, submitForm)}
            inputRef={inputRef}
          />

          <footer className="flex justify-end mt-5">
            {event ? (
              <Button variant="cancel" onPress={() => setEvent(null)} type="reset">
                {common("cancel")}
              </Button>
            ) : null}
            <Button disabled={state === "loading"} className="flex items-center ml-2" type="submit">
              {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}

              {event ? common("save") : t("addEvent")}
            </Button>
          </footer>

          <AutoForm event={event} />
        </Form>
      )}
    </Formik>
  );
}

function AutoForm<T extends IncidentEvent | Call911Event>({ event }: { event: T | null }) {
  const { setFieldValue } = useFormikContext();

  React.useEffect(() => {
    if (event !== null) {
      setFieldValue("description", event.description);
    } else {
      setFieldValue("description", "");
    }
  }, [event, setFieldValue]);

  return null;
}
