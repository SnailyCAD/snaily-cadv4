import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import Link from "next/link";
import {
  formatUnitDivisions,
  makeUnitName,
  yesOrNoText,
  formatOfficerDepartment,
  isEmpty,
} from "lib/utils";
import { useTranslations } from "use-intl";
import { Button, buttonVariants, TabsContent } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { Status } from "components/shared/Status";
import { usePermission, Permissions } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { OfficerRank } from "components/leo/OfficerRank";
import type {
  DeleteManageUnitByIdData,
  GetManageUnitsData,
  PutManageUnitsOffDutyData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { getSelectedTableRows } from "hooks/shared/table/use-table-state";
import { SearchArea } from "components/shared/search/search-area";
import dynamic from "next/dynamic";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import { useImageUrl } from "hooks/useImageUrl";
import { ImageWrapper } from "components/shared/image-wrapper";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal, {
  ssr: false,
});

const PruneUnitsModal = dynamic(
  async () => (await import("./all-units-tab/prune-units-modal")).PruneUnitsModal,
  {
    ssr: false,
  },
);

interface Props {
  units: GetManageUnitsData;
}

export function AllUnitsTab({ units }: Props) {
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
  const tableState = useTableState({ pagination: asyncTable.pagination });

  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageUnits], true);
  const hasManageAwardsPermissions = hasPermissions(
    [Permissions.ManageAwardsAndQualifications],
    true,
  );

  const hasDeletePermissions = hasPermissions([Permissions.DeleteUnits], true);
  const hasViewUsersPermissions = hasPermissions([Permissions.ViewUsers], true);
  const { state, execute } = useFetch();

  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const router = useRouter();
  const { DIVISIONS, BADGE_NUMBERS } = useFeatureEnabled();
  const { openModal, closeModal } = useModal();
  const { department } = useValues();
  const { makeImageUrl } = useImageUrl();

  function handleDeleteClick(unit: Unit) {
    unitState.setTempId(unit.id);
    openModal(ModalIds.AlertDeleteUnit);
  }

  async function handleDeleteUnit() {
    if (!tempUnit) return;

    const { json } = await execute<DeleteManageUnitByIdData>({
      path: `/admin/manage/units/${tempUnit.id}`,
      method: "DELETE",
    });

    if (json) {
      unitState.setTempId(null);
      closeModal(ModalIds.AlertDeleteUnit);

      router.replace({
        pathname: router.pathname,
        query: router.query,
      });
    }
  }

  async function setSelectedUnitsOffDuty() {
    const selectedRows = getSelectedTableRows(
      asyncTable.items,
      tableState.rowSelection,
      (unit) => `${unit.id}-${unit.type}`,
    );

    if (selectedRows.length <= 0) return;

    const { json } = await execute<PutManageUnitsOffDutyData>({
      path: "/admin/manage/units/off-duty",
      method: "PUT",
      data: { ids: selectedRows },
    });

    if (Array.isArray(json)) {
      for (const key of Object.keys(tableState.rowSelection)) {
        const idx = parseInt(key, 10);
        const unit = asyncTable.items[idx];
        if (!unit) continue;

        asyncTable.update(unit.id, { ...unit, status: null, statusId: null });
      }
      tableState.setRowSelection({});
    }
  }

  const LABELS = {
    DEPUTY: t("Ems.deputy"),
    OFFICER: t("Leo.officer"),
  };

  return (
    <TabsContent value="allUnits">
      {hasManagePermissions && asyncTable.items.length >= 1 ? (
        <Button
          disabled={isEmpty(tableState.rowSelection)}
          onPress={setSelectedUnitsOffDuty}
          className="mt-3"
        >
          {t("Management.setSelectedOffDuty")}
        </Button>
      ) : null}

      {hasManagePermissions && asyncTable.items.length >= 1 ? (
        <Button onPress={() => openModal(ModalIds.PruneUnits)} className="mt-3 ml-2">
          {t("Management.pruneUnits")}
        </Button>
      ) : null}

      <SearchArea
        search={{ search, setSearch }}
        asyncTable={asyncTable}
        totalCount={units.totalCount}
      >
        <FormField className="w-full max-w-[15rem]" label={t("Leo.department")}>
          <Select
            isClearable
            value={asyncTable.filters?.departmentId ?? null}
            onChange={(event) =>
              asyncTable.setFilters((prev) => ({ ...prev, departmentId: event.target.value }))
            }
            values={department.values.map((v) => ({
              label: v.value.value,
              value: v.id,
            }))}
          />
        </FormField>
      </SearchArea>

      {asyncTable.items.length <= 0 ? (
        <p>{t("Management.noUnits")}</p>
      ) : (
        <Table
          tableState={tableState}
          features={{ rowSelection: hasManagePermissions }}
          data={asyncTable.items.map((unit) => {
            const departmentStatus = unit.whitelistStatus?.status;

            return {
              id: unit.id,
              unit: LABELS[unit.type],
              name: (
                <div className="min-w-[144px]">
                  {unit.imageId ? (
                    <ImageWrapper
                      quality={70}
                      className="rounded-md w-[30px] h-[30px] object-cover mr-2 inline-block"
                      draggable={false}
                      src={makeImageUrl("units", unit.imageId)!}
                      loading="lazy"
                      width={30}
                      height={30}
                      alt={makeUnitName(unit)}
                    />
                  ) : null}
                  <p className="inline-block">{makeUnitName(unit)}</p>
                </div>
              ),
              user:
                hasViewUsersPermissions && unit.user ? (
                  <Link
                    href={`/admin/manage/users/${unit.userId}`}
                    className={`rounded-md transition-all p-1 px-1.5 ${buttonVariants.default}`}
                  >
                    {unit.user.username}
                  </Link>
                ) : (
                  // todo: add information about temporary unit here
                  unit.user?.username ?? t("Leo.temporaryUnit")
                ),
              callsign: generateCallsign(unit),
              badgeNumber: unit.badgeNumber,
              department: formatOfficerDepartment(unit) ?? common("none"),
              departmentStatus: <Status fallback="—">{departmentStatus}</Status>,
              division: formatUnitDivisions(unit),
              rank: <OfficerRank unit={unit} />,
              position: unit.position ?? common("none"),
              status: unit.status?.value.value ?? common("none"),
              suspended: common(yesOrNoText(unit.suspended)),
              actions: (
                <>
                  {hasManagePermissions || hasManageAwardsPermissions ? (
                    <Link
                      href={`/admin/manage/units/${unit.id}`}
                      className={classNames("p-0.5 px-2 rounded-md", buttonVariants.success)}
                    >
                      {common("manage")}
                    </Link>
                  ) : null}
                  {hasDeletePermissions ? (
                    <Button
                      size="xs"
                      className="ml-2"
                      onPress={() => handleDeleteClick(unit)}
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>
                  ) : null}
                </>
              ),
            };
          })}
          columns={[
            { header: `${t("Ems.deputy")}/${t("Leo.officer")}`, accessorKey: "unit" },
            { header: common("name"), accessorKey: "name" },
            { header: common("user"), accessorKey: "user" },
            { header: t("Leo.callsign"), accessorKey: "callsign" },
            BADGE_NUMBERS ? { header: t("Leo.badgeNumber"), accessorKey: "badgeNumber" } : null,
            { header: t("Leo.department"), accessorKey: "department" },
            DIVISIONS ? { header: t("Leo.division"), accessorKey: "division" } : null,
            { header: t("Leo.rank"), accessorKey: "rank" },
            { header: t("Leo.position"), accessorKey: "position" },
            { header: t("Leo.status"), accessorKey: "status" },
            { header: t("Leo.suspended"), accessorKey: "suspended" },
            { header: t("Leo.status"), accessorKey: "departmentStatus" },
            hasManagePermissions || hasManageAwardsPermissions || hasDeletePermissions
              ? { header: common("actions"), accessorKey: "actions" }
              : null,
          ]}
        />
      )}

      {tempUnit ? (
        <AlertModal
          title={t("Management.deleteUnit")}
          id={ModalIds.AlertDeleteUnit}
          onDeleteClick={handleDeleteUnit}
          state={state}
          description={t.rich("Management.alert_deleteUnit", {
            span: (c) => <span className="font-bold">{c}</span>,
            unit: `${generateCallsign(tempUnit)} ${makeUnitName(tempUnit)}`,
          })}
          onClose={() => unitState.setTempId(null)}
        />
      ) : null}

      {hasManagePermissions && asyncTable.items.length >= 1 ? <PruneUnitsModal /> : null}
    </TabsContent>
  );
}
