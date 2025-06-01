import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import Link from "next/link";
import { formatOfficerDepartment, makeUnitName } from "lib/utils";
import { useTranslations } from "use-intl";
import { Button, buttonVariants, SelectField, TabsContent } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { Permissions, usePermission } from "hooks/usePermission";
import type { GetManageUnitsData } from "@snailycad/types/api";
import { SearchArea } from "components/shared/search/search-area";
import dynamic from "next/dynamic";
import { useValues } from "context/ValuesContext";

const ManageUnitCallsignModal = dynamic(
  async () => (await import("./manage-unit-callsign-modal")).ManageUnitCallsignModal,
  { ssr: false },
);

interface Props {
  units: GetManageUnitsData;
}

export function CallsignsTab({ units }: Props) {
  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable({
    search,
    totalCount: units.totalCount,
    initialData: units.units,
    fetchOptions: {
      path: "/admin/manage/units",
      onResponse: (data: GetManageUnitsData) => ({
        data: data.units,
        totalCount: data.totalCount,
      }),
    },
  });

  const [tempUnit, unitState] = useTemporaryItem(asyncTable.items);

  const { hasPermissions } = usePermission();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const modalState = useModal();
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const hasViewUsersPermissions = hasPermissions([Permissions.ViewUsers]);
  const { department } = useValues();

  function handleManageClick(unit: Unit) {
    unitState.setTempId(unit.id);
    modalState.openModal(ModalIds.ManageUnitCallsign);
  }

  const LABELS = {
    DEPUTY: t("Ems.deputy"),
    OFFICER: t("Leo.officer"),
  };

  return (
    <TabsContent value="callsignManagement">
      <SearchArea
        search={{ search, setSearch }}
        asyncTable={asyncTable}
        totalCount={units.totalCount}
        className="grid grid-cols-3"
      >
        <SelectField
          label={t("Leo.department")}
          isClearable
          selectedKey={asyncTable.filters?.departmentId ?? null}
          options={department.values.map((value) => ({
            label: value.value.value,
            value: value.id,
          }))}
          onSelectionChange={(value) => {
            asyncTable.setFilters((prev) => ({ ...prev, departmentId: value }));
          }}
        />
      </SearchArea>

      {asyncTable.noItemsAvailable ? (
        <p className="my-2">{t("Management.noUnits")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((unit) => {
            return {
              id: unit.id,
              unit: LABELS[unit.type],
              name: makeUnitName(unit),
              user:
                hasViewUsersPermissions && unit.user ? (
                  <Link
                    href={`/admin/manage/users/${unit.userId}`}
                    className={buttonVariants({ size: "xs" })}
                  >
                    {unit.user.username}
                  </Link>
                ) : (
                  unit.user?.username ?? t("Leo.temporaryUnit")
                ),
              callsign1: unit.callsign,
              callsign2: unit.callsign2,
              callsign: generateCallsign(unit, "callsignTemplate"),
              department: formatOfficerDepartment(unit) ?? common("none"),
              actions: (
                <Button size="xs" onPress={() => handleManageClick(unit)}>
                  {common("manage")}
                </Button>
              ),
            };
          })}
          columns={[
            { header: `${t("Ems.deputy")}/${t("Leo.officer")}`, accessorKey: "unit" },
            { header: common("name"), accessorKey: "name" },
            { header: t("Leo.callsign1"), accessorKey: "callsign1" },
            { header: t("Leo.callsign2"), accessorKey: "callsign2" },
            { header: t("Leo.callsign"), accessorKey: "callsign" },
            { header: t("Leo.department"), accessorKey: "department" },
            { header: common("user"), accessorKey: "user" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      {tempUnit ? (
        <ManageUnitCallsignModal
          onUpdate={(unit) => {
            asyncTable.update(tempUnit.id, { ...tempUnit, ...unit });
            unitState.setTempId(null);
          }}
          unit={tempUnit}
        />
      ) : null}
    </TabsContent>
  );
}
