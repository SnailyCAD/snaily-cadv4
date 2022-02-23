import * as React from "react";
import type { Full911Call } from "state/dispatchState";
import type { FormikHelpers } from "formik";
import compareDesc from "date-fns/compareDesc";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import type { Call911Event } from "@snailycad/types";
import { EventItem } from "../events/EventItem";
import { UpdateEventForm } from "../events/UpdateEventForm";

interface Props {
  call: Full911Call;
  disabled?: boolean;
}

export function CallEventsArea({ disabled, call }: Props) {
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
    <div className="w-[45rem] ml-3 relative">
      <h4 className="text-xl font-semibold">{common("events")}</h4>

      <ul className="overflow-auto h-[65%]">
        {(call?.events.length ?? 0) <= 0 ? (
          <p className="mt-2">{t("noEvents")}</p>
        ) : (
          call?.events
            .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
            .map((event) => (
              <EventItem
                disabled={disabled}
                key={event.id}
                setTempEvent={setTempEvent}
                event={event}
              />
            ))
        )}
      </ul>

      {disabled ? null : (
        <UpdateEventForm
          onSubmit={onEventSubmit}
          state={state}
          event={tempEvent}
          setEvent={setTempEvent}
        />
      )}
    </div>
  );
}
