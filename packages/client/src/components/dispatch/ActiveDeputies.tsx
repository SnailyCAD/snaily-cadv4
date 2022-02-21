import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import type { ActiveDeputy } from "state/emsFdState";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { useRouter } from "next/router";
import { formatUnitDivisions, makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { StatusValue, StatusViewMode } from "@snailycad/types";
import { useAuth } from "context/AuthContext";
import { useImageUrl } from "hooks/useImageUrl";
import { Table } from "components/shared/Table";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { ContextMenu } from "components/shared/ContextMenu";
import { useValues } from "context/ValuesContext";
import useFetch from "lib/useFetch";

export function ActiveDeputies() {
  const { activeDeputies } = useActiveDeputies();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { user } = useAuth();
  const { makeImageUrl } = useImageUrl();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { codes10 } = useValues();
  const { execute } = useFetch();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const [tempUnit, setTempUnit] = React.useState<ActiveDeputy | null>(null);

  function handleEditClick(officer: ActiveDeputy) {
    setTempUnit(officer);
    openModal(ModalIds.ManageUnit);
  }

  async function setCode(id: string, status: StatusValue) {
    if (status.type === "STATUS_CODE") {
      await execute(`/dispatch/status/${id}`, {
        method: "PUT",
        data: { status: status.id },
      });
    }
  }

  return (
    <div className="mt-3 overflow-hidden rounded-md bg-gray-200/80 dark:bg-gray-2">
      <header className="p-2 px-4 bg-gray-300/50 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{t("Ems.activeDeputies")}</h3>
      </header>

      {activeDeputies.length <= 0 ? (
        <p className="px-4 py-2">{t("Ems.noActiveDeputies")}</p>
      ) : (
        <Table
          isWithinCard
          containerProps={{ className: "mb-3 px-4" }}
          data={activeDeputies.map((deputy) => {
            const color = deputy.status?.color;
            const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;

            const codesMapped = codes10.values
              .filter((v) => v.type === "STATUS_CODE")
              .map((v) => ({
                name: v.value.value,
                onClick: () => setCode(deputy.id, v),
                "aria-label": `Set status to ${v.value.value}`,
                title: `Set status to ${v.value.value}`,
              }));

            return {
              rowProps: { style: { background: !useDot ? color ?? undefined : undefined } },
              deputy: (
                <ContextMenu asChild items={codesMapped}>
                  <span className="flex items-center capitalize cursor-default">
                    {deputy.imageId ? (
                      <img
                        className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                        draggable={false}
                        src={makeImageUrl("units", deputy.imageId)}
                      />
                    ) : null}
                    {generateCallsign(deputy)} {makeUnitName(deputy)}
                  </span>
                </ContextMenu>
              ),
              badgeNumber: deputy.badgeNumber,
              department: deputy.department.value.value,
              division: formatUnitDivisions(deputy),
              rank: deputy.rank?.value ?? common("none"),
              status: (
                <span className="flex items-center">
                  {useDot && color ? (
                    <span
                      style={{ background: color }}
                      className="block w-3 h-3 mr-2 rounded-full"
                    />
                  ) : null}
                  {deputy.status?.value?.value}
                </span>
              ),
              actions: isDispatch ? (
                <>
                  <Button
                    disabled={!hasActiveDispatchers}
                    onClick={() => handleEditClick(deputy)}
                    small
                    variant="success"
                  >
                    {common("manage")}
                  </Button>
                </>
              ) : null,
            };
          })}
          columns={[
            { Header: t("Ems.deputy"), accessor: "deputy" },
            { Header: t("Leo.badgeNumber"), accessor: "badgeNumber" },
            { Header: t("Leo.department"), accessor: "department" },
            { Header: t("Leo.division"), accessor: "division" },
            { Header: t("Leo.rank"), accessor: "rank" },
            { Header: t("Leo.status"), accessor: "status" },
            isDispatch ? { Header: common("actions"), accessor: "actions" } : null,
          ]}
        />
      )}

      {tempUnit ? (
        <ManageUnitModal type="ems-fd" onClose={() => setTempUnit(null)} unit={tempUnit} />
      ) : null}
    </div>
  );
}
