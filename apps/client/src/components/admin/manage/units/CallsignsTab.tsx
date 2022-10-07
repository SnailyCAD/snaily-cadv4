import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import Link from "next/link";
import { formatOfficerDepartment, makeUnitName } from "lib/utils";
import { useTranslations } from "use-intl";
import { Button, buttonVariants } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table, useTableState } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { ManageUnitCallsignModal } from "./ManageUnitCallsignModal";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { Permissions, usePermission } from "hooks/usePermission";

interface Props {
  units: Unit[];
  search: string;
}

export function CallsignsTab({ search, units }: Props) {
  const [tempUnit, unitState] = useTemporaryItem(units);

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
      {units.length <= 0 ? (
        <p>{t("Management.noUnits")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={units.map((unit) => {
            return {
              id: unit.id,
              unit: LABELS[unit.type],
              name: makeUnitName(unit),
              user: hasViewUsersPermissions ? (
                <Link href={`/admin/manage/users/${unit.userId}`}>
                  <a
                    href={`/admin/manage/users/${unit.userId}`}
                    className={`rounded-md transition-all p-1 px-1.5 ${buttonVariants.default}`}
                  >
                    {unit.user.username}
                  </a>
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

      {tempUnit ? <ManageUnitCallsignModal unit={tempUnit} /> : null}
    </TabsContent>
  );
}
