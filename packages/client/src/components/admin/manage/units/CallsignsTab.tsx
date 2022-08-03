import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import Link from "next/link";
import { formatOfficerDepartment, makeUnitName } from "lib/utils";
import { useTranslations } from "use-intl";
import { Button, buttonVariants } from "components/Button";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { ManageUnitCallsignModal } from "./ManageUnitCallsignModal";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props {
  units: Unit[];
  search: string;
}

export function CallsignsTab({ search, units }: Props) {
  const [tempUnit, unitState] = useTemporaryItem(units);

  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const { openModal } = useModal();

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
          filter={search}
          data={units.map((unit) => {
            return {
              unit: LABELS[unit.type],
              name: makeUnitName(unit),
              user: (
                <Link href={`/admin/manage/users/${unit.userId}`}>
                  <a
                    href={`/admin/manage/users/${unit.userId}`}
                    className={`rounded-md transition-all p-1 px-1.5 ${buttonVariants.default}`}
                  >
                    {unit.user.username}
                  </a>
                </Link>
              ),
              callsign1: unit.callsign,
              callsign2: unit.callsign2,
              callsign: generateCallsign(unit),
              department: formatOfficerDepartment(unit) ?? common("none"),
              actions: (
                <Button size="xs" onClick={() => handleManageClick(unit)}>
                  {common("manage")}
                </Button>
              ),
            };
          })}
          columns={[
            { Header: `${t("Ems.deputy")}/${t("Leo.officer")}`, accessor: "unit" },
            { Header: common("name"), accessor: "name" },
            { Header: t("Leo.callsign1"), accessor: "callsign1" },
            { Header: t("Leo.callsign2"), accessor: "callsign2" },
            { Header: t("Leo.callsign"), accessor: "callsign" },
            { Header: t("Leo.department"), accessor: "department" },
            { Header: common("user"), accessor: "user" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      {tempUnit ? <ManageUnitCallsignModal unit={tempUnit} /> : null}
    </TabsContent>
  );
}
