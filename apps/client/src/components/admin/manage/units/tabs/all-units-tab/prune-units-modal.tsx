import * as React from "react";
import { Button, SelectField } from "@snailycad/ui";
import * as Accordion from "@radix-ui/react-accordion";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useAsyncTable } from "components/shared/Table";
import type { GetManageUnitsInactiveUnits } from "@snailycad/types/api";
import { toastMessage } from "lib/toastMessage";
import { Modal } from "components/modal/Modal";
import { FullDate } from "components/shared/FullDate";
import { CaretDownFill } from "react-bootstrap-icons";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import { isUnitOfficer } from "@snailycad/utils";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";

const initialData = {
  totalCount: 0,
  data: [] as GetManageUnitsInactiveUnits,
};

export function PruneUnitsModal() {
  const [days, setDays] = React.useState("30");
  const [action, setAction] = React.useState("SET_DEPARTMENT_DEFAULT");
  const [departmentId, setDepartmentId] = React.useState(null);

  const { department } = useValues();
  const { state, execute } = useFetch();
  const t = useTranslations();
  const { isOpen, closeModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();

  const asyncTable = useAsyncTable({
    totalCount: initialData.totalCount,
    initialData: initialData.data,
    fetchOptions: {
      refetchOnWindowFocus: false,
      path: "/admin/manage/units/prune",
      onResponse: (json: GetManageUnitsInactiveUnits) => ({
        data: json,
        totalCount: json.length,
      }),
    },
  });

  async function handleSubmit() {
    const unitIds = asyncTable.items.map((unit) => {
      const type = isUnitOfficer(unit) ? "OFFICER" : "EMS_FD";
      return `${type}-${unit.id}`;
    });

    const { json } = await execute<{ count: number }>({
      path: "/admin/manage/units/prune",
      method: "DELETE",
      data: {
        action,
        days,
        unitIds,
      },
    });

    if (typeof json.count === "number") {
      toastMessage({
        icon: "success",
        title: "Units Pruned",
        message: `Pruned ${json.count} units`,
      });
      closeModal(ModalIds.PruneUnits);
    }
  }

  return (
    <Modal
      onClose={() => closeModal(ModalIds.PruneUnits)}
      className="w-[800px]"
      title={t("Management.pruneUnits")}
      isOpen={isOpen(ModalIds.PruneUnits)}
    >
      <p className="my-2 text-neutral-700 dark:text-gray-400">
        {t("Management.pruneUnitsDescription")}
      </p>

      <SelectField
        isDisabled={asyncTable.isLoading}
        onSelectionChange={(value) => {
          setDays(value as string);
          asyncTable.setFilters((prevFilters) => ({ ...prevFilters, days: value as string }));
        }}
        selectedKey={days}
        label={t("Management.lastSeen")}
        options={[
          { label: "30 Days", value: "30" },
          { label: "3 Months", value: "90" },
          { label: "6 Months", value: "180" },
        ]}
      />

      <FormField label={t("Leo.department")}>
        <Select
          name="departmentId"
          onChange={(event) => {
            setDepartmentId(event.target.value);
            asyncTable.setFilters((prevFilters) => ({
              ...prevFilters,
              departmentId: event.target.value as string,
            }));
          }}
          value={departmentId}
          values={department.values.map((department) => ({
            label: department.value.value,
            value: department.id,
          }))}
        />
      </FormField>

      <SelectField
        isDisabled={asyncTable.isLoading}
        onSelectionChange={(value) => {
          setAction(value as string);
        }}
        selectedKey={action}
        label={t("Management.action")}
        options={[
          { value: "SET_DEPARTMENT_DEFAULT", label: "Set department to default department" },
          { value: "SET_DEPARTMENT_NULL", label: "Set department to none" },
          { value: "DELETE_UNIT", label: "Delete Units" },
        ]}
      />

      <Accordion.Root disabled={asyncTable.items.length <= 0} className="mt-4" type="multiple">
        <Accordion.Item value="unavailable-sounds">
          <Accordion.Trigger
            type="button"
            title="Click to expand"
            className="accordion-state gap-2 flex items-center justify-between pt-1 text-lg font-semibold text-left"
          >
            <h3 className="text-xl font-semibold leading-none">{t("Management.inactiveUnits")}</h3>

            <CaretDownFill
              width={16}
              height={16}
              className="transform w-4 h-4 transition-transform accordion-state-transform"
            />
          </Accordion.Trigger>

          <Accordion.Content asChild className="mt-3">
            <ul>
              {asyncTable.items.map((unit) => {
                const unitName = makeUnitName(unit);
                const callsign = generateCallsign(unit);

                return (
                  <li key={unit.id} className="my-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {callsign} {unitName}
                      </p>
                      {unit.lastStatusChangeTimestamp ? (
                        <p className="text-base">
                          <span className="font-semibold">{t("Management.lastSeen")}:</span>{" "}
                          <FullDate onlyDate>{unit.lastStatusChangeTimestamp}</FullDate>
                        </p>
                      ) : null}
                    </div>
                    <Button type="button" size="xs" onPress={() => asyncTable.remove(unit.id)}>
                      Keep
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      <footer>
        <Button
          onClick={handleSubmit}
          type="button"
          className="mt-4"
          isDisabled={asyncTable.isLoading || state === "loading"}
        >
          {t("Management.pruneUnits")}
        </Button>
      </footer>
    </Modal>
  );
}
