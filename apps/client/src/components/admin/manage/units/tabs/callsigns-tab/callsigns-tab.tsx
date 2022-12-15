import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import Link from "next/link";
import { formatOfficerDepartment, makeUnitName } from "lib/utils";
import { useTranslations } from "use-intl";
import { Button, buttonVariants } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { Permissions, usePermission } from "hooks/usePermission";
import type { GetManageUnitsData } from "@snailycad/types/api";
import { SearchArea } from "components/shared/search/search-area";
import dynamic from "next/dynamic";

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
  const { openModal } = useModal();
  const tableState = useTableState({ search: { value: search } });
  const hasViewUsersPermissions = hasPermissions([Permissions.ViewUsers], true);

  function handleManageClick(unit: Unit) {
    unitState.setTempId(unit.id);
    openModal(ModalIds.ManageUnitCallsign);
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
      />

      {asyncTable.items.length <= 0 ? (
        <p>{t("Management.noUnits")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((unit) => {
            return {
              id: unit.id,
              unit: LABELS[unit.type],
              name: makeUnitName(unit),
              user: hasViewUsersPermissions ? (
                <Link
                  href={`/admin/manage/users/${unit.userId}`}
                  className={`rounded-md transition-all p-1 px-1.5 ${buttonVariants.default}`}
                >
                  {unit.user.username}
                </Link>
              ) : (
                unit.user.username
              ),
              callsign1: unit.callsign,
              callsign2: unit.callsign2,
              callsign: generateCallsign(unit),
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
