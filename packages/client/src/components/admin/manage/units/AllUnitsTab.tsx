import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import Link from "next/link";
import { getUnitDepartment, formatUnitDivisions, makeUnitName, yesOrNoText } from "lib/utils";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { ThreeDots } from "react-bootstrap-icons";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { Table } from "components/shared/Table";
import { Dropdown } from "components/Dropdown";
import { Tab } from "@headlessui/react";

interface Props {
  units: Unit[];
}

export function AllUnitsTab({ units }: Props) {
  const [selectedRows, setSelectedRows] = React.useState<`${Unit["id"]}-${Unit["type"]}`[]>([]);

  const t = useTranslations();
  const common = useTranslations("Common");
  const generateCallsign = useGenerateCallsign();
  const { execute } = useFetch();
  const router = useRouter();

  function handleCheckboxChange(unit: Unit) {
    setSelectedRows((prev) => {
      if (prev.includes(`${unit.id}-${unit.type}`)) {
        return prev.filter((v) => v !== `${unit.id}-${unit.type}`);
      }

      return [...prev, `${unit.id}-${unit.type}`];
    });
  }

  async function setSelectedUnitsOffDuty() {
    if (selectedRows.length <= 0) return;

    const { json } = await execute("/admin/manage/units/off-duty", {
      method: "PUT",
      data: { ids: selectedRows },
    });

    if (Array.isArray(json)) {
      setSelectedRows([]);
      router.replace({
        pathname: router.pathname,
        query: router.query,
      });
    }
  }

  const LABELS = {
    DEPUTY: t("Ems.deputy"),
    OFFICER: t("Leo.officer"),
  };

  return (
    <Tab.Panel>
      <Table
        disabledColumnId={["dropdown"]}
        data={units.map((unit) => {
          const departmentStatus =
            "whitelistStatus" in unit ? unit.whitelistStatus?.status.toLowerCase() ?? "—" : "—";

          return {
            dropdown: (
              <input
                checked={selectedRows.includes(`${unit.id}-${unit.type}`)}
                onChange={() => handleCheckboxChange(unit)}
                type="checkbox"
              />
            ),
            unit: LABELS[unit.type],
            name: makeUnitName(unit),
            callsign: generateCallsign(unit),
            badgeNumber: unit.badgeNumber,
            department: getUnitDepartment(unit)?.value.value ?? common("none"),
            departmentStatus,
            division: formatUnitDivisions(unit),
            rank: unit.rank?.value ?? common("none"),
            status: unit.status?.value.value ?? common("none"),
            suspended: common(yesOrNoText(unit.suspended)),
            actions: (
              <Link href={`/admin/manage/units/${unit.id}`}>
                <a>
                  <Button small variant="success">
                    {common("manage")}
                  </Button>
                </a>
              </Link>
            ),
          };
        })}
        columns={[
          {
            Header: (
              <UnitsDropdown
                disabled={selectedRows.length <= 0}
                onClick={setSelectedUnitsOffDuty}
              />
            ),
            accessor: "dropdown",
          },
          { Header: `${t("Ems.deputy")}/${t("Leo.officer")}`, accessor: "unit" },
          { Header: common("name"), accessor: "name" },
          { Header: t("Leo.callsign"), accessor: "callsign" },
          { Header: t("Leo.badgeNumber"), accessor: "badgeNumber" },
          { Header: t("Leo.department"), accessor: "department" },
          { Header: t("Leo.status"), accessor: "departmentStatus" },
          { Header: t("Leo.division"), accessor: "division" },
          { Header: t("Leo.rank"), accessor: "rank" },
          { Header: t("Leo.status"), accessor: "status" },
          { Header: t("Leo.suspended"), accessor: "suspended" },
          { Header: common("actions"), accessor: "actions" },
        ]}
      />
    </Tab.Panel>
  );
}

function UnitsDropdown({ onClick, disabled }: { disabled: boolean; onClick: any }) {
  return (
    <Dropdown
      trigger={
        <Button variant="transparent">
          <ThreeDots />
        </Button>
      }
    >
      <Dropdown.Item disabled={disabled} onClick={onClick}>
        Set selected units off-duty
      </Dropdown.Item>
    </Dropdown>
  );
}
