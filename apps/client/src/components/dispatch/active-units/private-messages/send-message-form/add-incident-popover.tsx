import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Button, SelectField } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { useFormikContext } from "formik";
import type { LeoIncident } from "@snailycad/types";
import { ChevronDown } from "react-bootstrap-icons";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";

export function AddIncidentPopover() {
  const t = useTranslations("Leo");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const { errors, values, setValues, setFieldValue } = useFormikContext<{
    incidentId: string | null;
    incident: LeoIncident | null;
  }>();

  const { activeIncidents } = useActiveIncidents();

  return (
    <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <Popover.Trigger asChild>
        <span>
          <Button
            className="flex items-center gap-2"
            onPress={() => setIsPopoverOpen((v) => !v)}
            size="xs"
          >
            {values.incident?.caseNumber
              ? t("appendedActiveIncident", {
                  incident: `#${values.incident.caseNumber}`,
                })
              : t("addActiveIncident")}
            <ChevronDown className="w-3" />
          </Button>
        </span>
      </Popover.Trigger>

      <Popover.Content className="z-50 p-4 bg-gray-200 rounded-md shadow-md dropdown-fade w-96 dark:bg-primary dark:border dark:border-secondary">
        <h3 className="text-xl font-semibold mb-3">{t("addActiveIncident")}</h3>

        <SelectField
          label={t("activeIncident")}
          options={activeIncidents.map((incident) => ({
            value: incident.id,
            label: `#${incident.caseNumber}`,
          }))}
          isClearable
          errorMessage={errors.incidentId}
          className="w-full"
          name="incidentId"
          selectedKey={values.incidentId}
          onSelectionChange={(key) => {
            if (key === null) {
              // key can be null
              setValues({ ...values, incident: null, incidentId: null });
              return;
            }

            setFieldValue("incidentId", key as string | null);
          }}
        />

        <Button
          size="xs"
          onPress={() => {
            setValues({
              ...values,
              incident: activeIncidents.find((v) => v.id === values.incidentId) ?? null,
            });

            setIsPopoverOpen(false);
          }}
        >
          {t("addActiveIncident")}
        </Button>

        <Popover.Arrow className="fill-primary" />
      </Popover.Content>
    </Popover.Root>
  );
}
