import * as React from "react";
import {
  Button,
  SelectField,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  FullDate,
} from "@snailycad/ui";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useAsyncTable } from "components/shared/Table";
import type { GetManageUnitsInactiveUnits } from "@snailycad/types/api";
import { toastMessage } from "lib/toastMessage";
import { Modal } from "components/modal/Modal";
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

  const { department } = useValues();
  const { state, execute } = useFetch();
  const t = useTranslations();
  const modalState = useModal();
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
      modalState.closeModal(ModalIds.PruneUnits);
    }
  }

  return (
    <Modal
      onClose={() => modalState.closeModal(ModalIds.PruneUnits)}
      className="w-[800px]"
      title={t("Management.pruneUnits")}
      isOpen={modalState.isOpen(ModalIds.PruneUnits)}
    >
      <p className="my-2 text-neutral-700 dark:text-gray-400">
        {t("Management.pruneUnitsDescription")}
      </p>

      <SelectField
        isLoading={asyncTable.isLoading}
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

      <SelectField
        isOptional
        isClearable
        label={t("Leo.department")}
        isLoading={asyncTable.isLoading}
        isDisabled={asyncTable.isLoading}
        selectedKey={asyncTable.filters?.departmentId ?? null}
        onSelectionChange={(value) => {
          asyncTable.setFilters((prevFilters) => ({
            ...prevFilters,
            departmentId: value as string,
          }));
        }}
        options={department.values.map((department) => ({
          label: department.value.value,
          value: department.id,
        }))}
      />

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

      <Accordion disabled={asyncTable.noItemsAvailable} className="mt-4" type="multiple">
        <AccordionItem value="unavailable-sounds">
          <AccordionTrigger type="button" title="Click to expand">
            <h3 className="text-xl leading-none">{t("Management.inactiveUnits")}</h3>
          </AccordionTrigger>

          <AccordionContent asChild className="mt-3">
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
                      {unit.updatedAt ? (
                        <p className="text-base">
                          <span className="font-semibold">{t("Management.lastSeen")}:</span>{" "}
                          <FullDate onlyDate>{unit.updatedAt}</FullDate>
                        </p>
                      ) : null}
                    </div>
                    <Button type="button" size="xs" onPress={() => asyncTable.remove(unit.id)}>
                      {t("Management.keep")}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <footer>
        <Button
          onPress={handleSubmit}
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
