import type { EmsFdIncident, LeoIncident } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import compareDesc from "date-fns/compareDesc";
import { UpdateEventForm } from "components/dispatch/events/UpdateEventForm";
import { EventItem } from "components/dispatch/events/EventItem";
import type { FormikHelpers } from "formik";
import { classNames } from "lib/classNames";
import type { PostIncidentEventsData, PutIncidentEventByIdData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props {
  incident: LeoIncident | EmsFdIncident;
  disabled?: boolean;

  handleStateUpdate?(incident: LeoIncident | EmsFdIncident): void;
}

export function IncidentEventsArea({ disabled, incident, handleStateUpdate }: Props) {
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const [tempEvent, eventState] = useTemporaryItem(incident.events ?? []);

  async function onEventSubmit(
    values: { description: string },
    helpers: FormikHelpers<{ description: string }>,
  ) {
    if (tempEvent) {
      const { json } = await execute<PutIncidentEventByIdData>({
        path: `/incidents/events/${incident.id}/${tempEvent.id}`,
        method: "PUT",
        data: values,
      });

      handleStateUpdate?.(json);
    } else {
      const { json } = await execute<PostIncidentEventsData>({
        path: `/incidents/events/${incident.id}`,
        method: "POST",
        data: values,
      });

      handleStateUpdate?.(json);
    }

    helpers.resetForm();
  }

  return (
    <div className="w-[45rem] ml-3 relative">
      <h4 className="text-xl font-semibold mb-2">{common("events")}</h4>

      <ul className={classNames("overflow-auto max-h-[500px]", disabled ? "h-[90%]" : "h-[55%]")}>
        {(incident.events?.length ?? 0) <= 0 ? (
          <p className="mt-2">{t("noIncidentEvents")}</p>
        ) : (
          incident.events
            ?.sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
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
