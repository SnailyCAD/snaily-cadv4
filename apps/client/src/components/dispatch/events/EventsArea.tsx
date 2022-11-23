import type { Full911Call } from "state/dispatch/dispatch-state";
import type { FormikHelpers } from "formik";
import compareDesc from "date-fns/compareDesc";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { EventItem } from "./EventItem";
import { UpdateEventForm } from "./UpdateEventForm";
import type { Post911CallEventsData, Put911CallEventByIdData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props {
  call: Full911Call;
  disabled?: boolean;
  handleStateUpdate?(call: Full911Call): void;
}

export function CallEventsArea({ disabled, call, handleStateUpdate }: Props) {
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const [tempEvent, eventState] = useTemporaryItem(call.events);

  async function onEventSubmit(
    values: { description: string },
    helpers: FormikHelpers<{ description: string }>,
  ) {
    if (!call) return;

    if (tempEvent) {
      const { json } = await execute<Put911CallEventByIdData>({
        path: `/911-calls/events/${call.id}/${tempEvent.id}`,
        method: "PUT",
        data: values,
      });

      if (json.id) {
        handleStateUpdate?.(json);
      }
    } else {
      const { json } = await execute<Post911CallEventsData>({
        path: `/911-calls/events/${call.id}`,
        method: "POST",
        data: values,
      });

      if (json.id) {
        handleStateUpdate?.(json);
      }
    }

    eventState.setTempId(null);
    helpers.resetForm();
  }

  return (
    <div className="md:w-[45rem] w-full mt-5 md:mt-0 md:ml-3 relative">
      <h4 className="text-xl font-semibold">{common("events")}</h4>

      <ul className="overflow-auto max-h-[350px] md:max-h-[65%] md:h-[65%]">
        {(call?.events?.length ?? 0) <= 0 ? (
          <p className="mt-2">{t("noEvents")}</p>
        ) : (
          call?.events
            .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
            .map((event) => (
              <EventItem
                disabled={disabled}
                key={event.id}
                setTempEvent={eventState.setTempId}
                event={event}
                isEditing={tempEvent?.id === event.id}
                onEventDelete={handleStateUpdate}
              />
            ))
        )}
      </ul>

      {disabled ? null : (
        <UpdateEventForm
          onSubmit={onEventSubmit}
          state={state}
          event={tempEvent}
          setEvent={eventState.setTempId}
        />
      )}
    </div>
  );
}
