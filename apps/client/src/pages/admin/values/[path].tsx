import { useTranslations } from "use-intl";
import * as React from "react";
import { useRouter } from "next/router";
import { Button, FullDate } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import { type AnyValue, ValueType } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { getObjLength, isEmpty, requestAll, yesOrNoText } from "lib/utils";
import dynamic from "next/dynamic";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useTableDataOfType, useTableHeadersOfType } from "lib/admin/values/values";
import { OptionsDropdown } from "components/admin/values/import/options-dropdown";
import { Title } from "components/shared/Title";
import { AlertModal } from "components/modal/AlertModal";
import { ModalIds } from "types/modal-ids";
import { valueRoutes } from "components/admin/Sidebar/routes";
import type {
  DeleteValuesBulkData,
  GetValuesData,
  PutValuePositionsData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import * as Tooltip from "@radix-ui/react-tooltip";
import { isValueInUse } from "lib/admin/values/isValueInUse";
import {
  getCreatedAtFromValue,
  getDisabledFromValue,
  getValueStrFromValue,
  hasTableDataChanged,
} from "lib/admin/values/utils";
import type { AccessorKeyColumnDef } from "@tanstack/react-table";
import { getSelectedTableRows } from "hooks/shared/table/use-table-state";
import { SearchArea } from "components/shared/search/search-area";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { toastMessage } from "lib/toastMessage";
import Link from "next/link";
import { BoxArrowUpRight, CloudArrowUp, InfoCircle } from "react-bootstrap-icons";
import { useAuth } from "context/AuthContext";

const ManageValueModal = dynamic(
  async () => (await import("components/admin/values/ManageValueModal")).ManageValueModal,
  { ssr: false },
);

const AlertDeleteValueModal = dynamic(
  async () =>
    (await import("components/admin/values/alert-delete-value-modal")).AlertDeleteValueModal,
  { ssr: false },
);

const ImportValuesModal = dynamic(
  async () =>
    (await import("components/admin/values/import/import-values-modal")).ImportValuesModal,
  { ssr: false },
);

interface Props {
  pathValues: GetValuesData[number];
}

const pathsRecord: Partial<Record<ValueType, ValueType[]>> = {
  [ValueType.DEPARTMENT]: [ValueType.OFFICER_RANK],
  [ValueType.DIVISION]: [ValueType.DEPARTMENT],
  [ValueType.QUALIFICATION]: [ValueType.DEPARTMENT],
  [ValueType.CODES_10]: [ValueType.DEPARTMENT],
  [ValueType.OFFICER_RANK]: [ValueType.DEPARTMENT],
  [ValueType.EMERGENCY_VEHICLE]: [ValueType.DEPARTMENT, ValueType.DIVISION],
  [ValueType.VEHICLE]: [ValueType.VEHICLE_TRIM_LEVEL],
};

export default function ValuePath({ pathValues: { totalCount, type, values: data } }: Props) {
  const router = useRouter();
  const path = (router.query.path as string).toUpperCase().replace(/-/g, "_");
  const routeData = valueRoutes.find((v) => v.type === type);
  const { user } = useAuth();

  useLoadValuesClientSide({
    // @ts-expect-error - this is fine
    valueTypes: pathsRecord[type] ? pathsRecord[type] : [],
  });

  const isBaseObj = (
    [
      ValueType.ADDRESS_FLAG,
      ValueType.BLOOD_GROUP,
      ValueType.CITIZEN_FLAG,
      ValueType.VEHICLE_FLAG,
      ValueType.ETHNICITY,
      ValueType.GENDER,
      ValueType.IMPOUND_LOT,
      ValueType.OFFICER_RANK,
      ValueType.VEHICLE_TRIM_LEVEL,
      ValueType.WEAPON_FLAG,
    ] as string[]
  ).includes(type);
  const [search, setSearch] = React.useState("");
  const asyncTable = useAsyncTable({
    search,
    sortingSchema: {
      value: isBaseObj ? "value" : "value.value",
      gameHash: "hash",
      isDisabled: isBaseObj ? "isDisabled" : "value.isDisabled",
      createdAt: isBaseObj ? "createdAt" : "value.createdAt",
      pairedUnitTemplate: "pairedUnitTemplate",
      department: "department.value.value",
      callsign: "callsign",
      type: "type",
      whitelisted: "whitelisted",
      isDefaultDepartment: "isDefaultDepartment",
      defaultOfficerRank: "defaultOfficerRank.value",
      color: "color",
      shouldDo: "shouldDo",
    },
    fetchOptions: {
      onResponse(json: GetValuesData) {
        const [forType] = json;
        if (!forType) return { data, totalCount };
        return { data: forType.values, totalCount: forType.totalCount };
      },
      path: `/admin/values/${type.toLowerCase()}?includeAll=false&cache=false`,
    },
    initialData: data,
    totalCount,
  });

  const [allSelected, setAllSelected] = React.useState(false);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);
  const [tempValue, valueState] = useTemporaryItem(asyncTable.items);
  const { state, execute } = useFetch();

  const modalState = useModal();
  const t = useTranslations("Values");
  const typeT = useTranslations(type);
  const common = useTranslations("Common");

  const extraTableHeaders = useTableHeadersOfType(type);
  const extraTableData = useTableDataOfType(type);
  const tableState = useTableState({
    sorting: asyncTable.sorting,
    pagination: asyncTable.pagination,
    dragDrop: { onListChange: setList },
  });

  const tableHeaders = React.useMemo(() => {
    return [
      user?.developerMode ? { header: common("id"), accessorKey: "id" } : null,
      { header: t("value"), accessorKey: "value" },
      ...extraTableHeaders,
      { header: t("isDisabled"), accessorKey: "isDisabled" },
      { header: common("createdAt"), accessorKey: "createdAt" },
      { header: common("actions"), accessorKey: "actions" },
    ] as AccessorKeyColumnDef<{ id: string }, "id">[];
  }, [extraTableHeaders, t, common, user?.developerMode]);

  async function setList(list: AnyValue[]) {
    if (!hasTableDataChanged(asyncTable.items, list)) return;

    for (const [index, value] of list.entries()) {
      if ("position" in value) {
        value.position = index;
      } else {
        value.value.position = index;
      }

      asyncTable.move(value.id, index);
      asyncTable.update(value.id, value);
    }

    setIsSavingOrder(true);
    await execute<PutValuePositionsData>({
      path: `/admin/values/${type.toLowerCase()}/positions`,
      method: "PUT",
      data: {
        ids: list.map((v) => {
          return "createdAt" in v ? v.id : v.valueId;
        }),
      },
    });

    setTimeout(() => {
      setIsSavingOrder(false);
    }, 1000);
  }

  function handleDeleteClick(value: AnyValue) {
    valueState.setTempId(value.id);
    modalState.openModal(ModalIds.AlertDeleteValue);
  }

  function handleEditClick(value: AnyValue) {
    valueState.setTempId(value.id);
    modalState.openModal(ModalIds.ManageValue);
  }

  async function handleDeleteSelected() {
    const selectedRows = allSelected
      ? { all: true }
      : getSelectedTableRows(data, tableState.rowSelection);

    const { json } = await execute<DeleteValuesBulkData>({
      path: `/admin/values/${type.toLowerCase()}/bulk-delete`,
      method: "DELETE",
      data: selectedRows,
    });

    if (json) {
      if (Array.isArray(selectedRows)) {
        asyncTable.remove(...selectedRows);
      } else {
        asyncTable.setItems([]);
      }

      setAllSelected(false);
      tableState.setRowSelection({});
      modalState.closeModal(ModalIds.AlertDeleteSelectedValues);

      toastMessage({
        title: "Delete Values",
        icon: "info",
        message: t("deletedSelectedValues", {
          failed: json.failed,
          deleted: json.success,
        }),
      });
    }
  }

  React.useEffect(() => {
    // reset form values
    if (!modalState.isOpen(ModalIds.ManageValue) && !modalState.isOpen(ModalIds.AlertDeleteValue)) {
      // timeout: wait for modal to close
      setTimeout(() => valueState.setTempId(null), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalState]);

  if (!Object.keys(ValueType).includes(path)) {
    return (
      <Layout className="dark:text-white">
        <p>Path not found</p>
      </Layout>
    );
  }

  const documentationUrl = createValueDocumentationURL(type);

  return (
    <AdminLayout
      permissions={{
        permissions: routeData?.permissions ?? [],
      }}
    >
      <header className="flex items-center justify-between">
        <div>
          <Title className="!mb-0">{typeT("MANAGE")}</Title>
          <h2 className="text-lg font-semibold">
            {t("totalItems")}:{" "}
            <span className="font-normal">{asyncTable.pagination.totalDataCount}</span>
          </h2>
          <Link
            className="mt-1 underline flex items-center gap-1 text-blue-500"
            target="_blank"
            href={documentationUrl}
          >
            {common("learnMore")}
            <BoxArrowUpRight className="inline-block" />
          </Link>
        </div>

        <div className="flex gap-2">
          {isEmpty(tableState.rowSelection) ? null : (
            <Button
              onPress={() => modalState.openModal(ModalIds.AlertDeleteSelectedValues)}
              variant="danger"
            >
              {t("deleteSelectedValues")}
            </Button>
          )}
          <Button onPress={() => modalState.openModal(ModalIds.ManageValue)}>{typeT("ADD")}</Button>
          <OptionsDropdown type={type} valueLength={asyncTable.items.length} />
        </div>
      </header>

      <SearchArea search={{ search, setSearch }} asyncTable={asyncTable} totalCount={totalCount} />

      {!allSelected &&
      getObjLength(tableState.rowSelection) === tableState.pagination.pageSize &&
      totalCount > tableState.pagination.pageSize ? (
        <div className="flex items-center gap-2 px-4 py-2 card my-3 !bg-slate-900 !border-slate-500 border-2">
          <InfoCircle />
          <span>
            {getObjLength(tableState.rowSelection)} items selected.{" "}
            <Button
              onPress={() => setAllSelected(true)}
              variant="transparent"
              className="underline"
              size="xs"
            >
              {t("selectAll", { count: totalCount })}
            </Button>
          </span>
        </div>
      ) : null}

      {allSelected ? (
        <div className="flex items-center gap-2 px-4 py-2 card my-3 !bg-slate-900 !border-slate-500 border-2">
          <InfoCircle />
          {t("xItemsSelected", { count: totalCount })}
        </div>
      ) : null}

      {isSavingOrder ? (
        <div className="flex items-center gap-2 px-4 py-2 card my-3 !bg-slate-900 !border-slate-500 border-2">
          <CloudArrowUp />
          Saving..., please do not close the browser or refresh the page.
        </div>
      ) : null}

      {asyncTable.noItemsAvailable ? (
        <p className="mt-5">{t("noValuesForThisType")}</p>
      ) : (
        <Table
          tableState={tableState}
          features={{ dragAndDrop: true, rowSelection: true }}
          containerProps={{
            style: { overflowY: "auto", maxHeight: "75vh" },
          }}
          data={asyncTable.items.map((value) => ({
            id: value.id,
            rowProps: { value },
            value: getValueStrFromValue(value),
            ...extraTableData(value),
            isDisabled: common(yesOrNoText(getDisabledFromValue(value))),
            createdAt: <FullDate>{getCreatedAtFromValue(value)}</FullDate>,
            actions: (
              <>
                <Button size="xs" onPress={() => handleEditClick(value)} variant="success">
                  {common("edit")}
                </Button>

                <Tooltip.Provider delayDuration={0}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Button
                        size="xs"
                        onPress={() => handleDeleteClick(value)}
                        variant="danger"
                        className="ml-2"
                        disabled={isValueInUse(value)}
                      >
                        {common("delete")}
                      </Button>
                    </Tooltip.Trigger>

                    {isValueInUse(value) ? (
                      <Tooltip.Portal>
                        <Tooltip.Content
                          align="center"
                          side="left"
                          sideOffset={5}
                          className="rounded-md bg-white dark:bg-tertiary dark:text-white p-4 max-w-[350px] z-999"
                        >
                          {t("cannotDeleteTooltip")}
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    ) : null}
                  </Tooltip.Root>
                </Tooltip.Provider>
              </>
            ),
          }))}
          columns={tableHeaders}
        />
      )}

      <AlertDeleteValueModal
        type={type}
        valueState={[tempValue, valueState]}
        asyncTable={asyncTable}
      />

      <AlertModal
        id={ModalIds.AlertDeleteSelectedValues}
        description={t("alert_deleteSelectedValues", {
          length: allSelected ? totalCount : getObjLength(tableState.rowSelection),
        })}
        onDeleteClick={handleDeleteSelected}
        title={typeT("DELETE")}
        state={state}
      />

      <ManageValueModal
        onCreate={(value) => {
          asyncTable.append(value);
        }}
        onUpdate={(previousValue, newValue) => {
          asyncTable.update(previousValue.id, newValue);
        }}
        value={tempValue}
        type={type}
      />
      <ImportValuesModal onImport={(data) => asyncTable.append(...data)} type={type} />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req, query }) => {
  const path = (query.path as string).replace(/-/g, "_") as Lowercase<ValueType>;

  const user = await getSessionUser(req);
  const [pathValues] = await requestAll(req, [
    [
      `/admin/values/${path}?includeAll=false&cache=false`,
      {
        totalCount: 0,
        values: [],
        type: path.toUpperCase(),
      },
    ],
  ]);

  return {
    props: {
      pathValues: pathValues?.[0] ?? { type: path, values: [] },
      session: user,
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
    },
  };
};

export function createValueDocumentationURL(type: ValueType) {
  const transformedPaths: Partial<Record<ValueType, string>> = {
    [ValueType.DRIVERSLICENSE_CATEGORY]: "license-category",
    [ValueType.BLOOD_GROUP]: "bloodgroup",
  };

  const path = transformedPaths[type] ?? type.replace(/_/g, "-").toLowerCase();
  return `https://docs.snailycad.org/docs/features/general/values/${path}`;
}
