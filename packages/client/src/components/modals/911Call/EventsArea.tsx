import * as React from "react";
import { Full911Call } from "state/dispatchState";
import { Form, Formik, FormikHelpers, useFormikContext } from "formik";
import format from "date-fns/format";
import compareDesc from "date-fns/compareDesc";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { FormField } from "components/form/FormField";
import { Error } from "components/form/Error";
import { Button } from "components/Button";
import { Loader } from "components/Loader";
import { Textarea } from "components/form/Textarea";
import { Call911Event } from "types/prisma";
import { Pencil, X } from "react-bootstrap-icons";
import useHoverDirty from "react-use/lib/useHoverDirty";
import { classNames } from "lib/classNames";
import { useModal } from "context/ModalContext";
import { AlertModal } from "components/modal/AlertModal";
import { ModalIds } from "types/ModalIds";

interface Props {
  call: Full911Call;
}

export const CallEventsArea = ({ call }: Props) => {
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const [tempEvent, setTempEvent] = React.useState<Call911Event | null>(null);

  async function onEventSubmit(values: { description: string }, helpers: FormikHelpers<any>) {
    if (!call) return;

    if (tempEvent) {
      await execute(`/911-calls/events/${call.id}/${tempEvent.id}`, {
        method: "PUT",
        data: values,
      });
    } else {
      await execute(`/911-calls/events/${call.id}`, {
        method: "POST",
        data: values,
      });
    }

    helpers.resetForm();
  }

  return (
    <div className="w-[28rem] ml-3 relative">
      <h4 className="font-semibold text-xl">{common("events")}</h4>

      <ul className="overflow-auto h-[210px]">
        {(call?.events.length ?? 0) <= 0 ? (
          <p className="mt-2">{t("noEvents")}</p>
        ) : (
          call?.events
            .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
            .map((event) => <EventItem key={event.id} setTempEvent={setTempEvent} event={event} />)
        )}
      </ul>

      <Formik
        onSubmit={onEventSubmit}
        initialValues={{ description: tempEvent?.description ?? "" }}
      >
        {({ handleChange, values, errors }) => (
          <Form className="absolute bottom-0 w-full">
            <FormField label="description">
              <Textarea
                required
                id="description"
                value={values.description}
                onChange={handleChange}
              />
              <Error>{errors.description}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              {tempEvent ? (
                <Button variant="cancel" onClick={() => setTempEvent(null)} type="reset">
                  {common("cancel")}
                </Button>
              ) : null}
              <Button
                disabled={state === "loading"}
                className="ml-2 flex items-center"
                type="submit"
              >
                {state === "loading" ? <Loader className="border-red-200 mr-2" /> : null}

                {tempEvent ? common("save") : t("addEvent")}
              </Button>
            </footer>

            <AutoForm event={tempEvent} />
          </Form>
        )}
      </Formik>
    </div>
  );
};

const EventItem = ({ event, setTempEvent }: { event: Call911Event; setTempEvent: any }) => {
  const { openModal, closeModal } = useModal();
  const formatted = format(new Date(event.createdAt), "HH:mm:ss");
  const actionsRef = React.useRef<HTMLLIElement>(null);
  const isHovering = useHoverDirty(actionsRef);
  const t = useTranslations("Calls");
  const { execute } = useFetch();
  const [open, setOpen] = React.useState(false);

  function handleOpen() {
    setOpen(true);
    openModal(ModalIds.AlertDeleteCallEvent);
  }

  function handleClose() {
    setOpen(false);
    closeModal(ModalIds.AlertDeleteCallEvent);
  }

  async function deleteEvent() {
    await execute(`/911-calls/events/${event.call911Id}/${event.id}`, {
      method: "DELETE",
    });

    handleClose();
  }

  return (
    <li ref={actionsRef} className="flex justify-between">
      <div>
        <span className="select-none text-gray-800 mr-1 font-semibold">{formatted}:</span>
        <span>{event.description}</span>
      </div>

      <div
        className={classNames(
          "transition-all",
          isHovering ? "opacity-100 pointer-events-all" : "opacity-0 pointer-events-none",
        )}
      >
        <Button
          className="p-0 px-0 mr-2"
          small
          variant="cancel"
          onClick={() => setTempEvent(event)}
        >
          <Pencil width={15} />
        </Button>
        <Button className="p-0 px-0" small variant="cancel" onClick={handleOpen}>
          <X width={20} height={20} />
        </Button>
      </div>

      {open ? (
        <AlertModal
          description={t("alert_deleteCallEvent")}
          onDeleteClick={deleteEvent}
          title={t("deleteCallEvent")}
          id={ModalIds.AlertDeleteCallEvent}
        />
      ) : null}
    </li>
  );
};

const AutoForm = ({ event }: { event: Call911Event | null }) => {
  const { setFieldValue } = useFormikContext();

  React.useEffect(() => {
    if (event !== null) {
      setFieldValue("description", event.description);
    } else {
      setFieldValue("description", "");
    }
  }, [event, setFieldValue]);

  return null;
};
