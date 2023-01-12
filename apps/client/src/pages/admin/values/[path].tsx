import { useTranslations } from "use-intl";
import * as React from "react";
import { useRouter } from "next/router";
import { Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import { type AnyValue, ValueType, Rank } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { getObjLength, isEmpty, requestAll, yesOrNoText } from "lib/utils";
import dynamic from "next/dynamic";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useTableDataOfType, useTableHeadersOfType } from "lib/admin/values/values";
import { OptionsDropdown } from "components/admin/values/import/options-dropdown";
import { Title } from "components/shared/Title";
import { AlertModal } from "components/modal/AlertModal";
import { ModalIds } from "types/ModalIds";
import { FullDate } from "components/shared/FullDate";
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

export default function ValuePath({ pathValues: { totalCount, type, values: data } }: Props) {
  const router = useRouter();
  const path = (router.query.path as string).toUpperCase().replace("-", "_");
  const routeData = valueRoutes.find((v) => v.type === type);

  const pathsRecord: Partial<Record<ValueType, ValueType[]>> = {
    [ValueType.DEPARTMENT]: [ValueType.OFFICER_RANK],
    [ValueType.DIVISION]: [ValueType.DEPARTMENT],
    [ValueType.QUALIFICATION]: [ValueType.DEPARTMENT],
    [ValueType.CODES_10]: [ValueType.DEPARTMENT],
    [ValueType.OFFICER_RANK]: [ValueType.DEPARTMENT],
    [ValueType.EMERGENCY_VEHICLE]: [ValueType.DEPARTMENT, ValueType.DIVISION],
  };

  useLoadValuesClientSide({
    // @ts-expect-error - this is fine
    valueTypes: pathsRecord[type] ? pathsRecord[type] : [],
  });

  const [search, setSearch] = React.useState("");
  const asyncTable = useAsyncTable({
    search,
    fetchOptions: {
      onResponse(json: GetValuesData) {
        const [forType] = json;
        if (!forType) return { data, totalCount };
        return { data: forType.values, totalCount: forType.totalCount };
      },
      path: `/admin/values/${type.toLowerCase()}?includeAll=false`,
    },
    initialData: data,
    totalCount,
  });

  const [tempValue, valueState] = useTemporaryItem(asyncTable.items);
  const { state, execute } = useFetch();

  const { isOpen, openModal, closeModal } = useModal();
  const t = useTranslations("Values");
  const typeT = useTranslations(type);
  const common = useTranslations("Common");

  const extraTableHeaders = useTableHeadersOfType(type);
  const extraTableData = useTableDataOfType(type);
  const tableState = useTableState({
    pagination: asyncTable.pagination,
    dragDrop: { onListChange: setList },
  });

  const tableHeaders = React.useMemo(() => {
    return [
      { header: "ID", accessorKey: "id" },
      { header: "Value", accessorKey: "value" },
      ...extraTableHeaders,
      { header: t("isDisabled"), accessorKey: "isDisabled" },
      { header: common("createdAt"), accessorKey: "createdAt" },
      { header: common("actions"), accessorKey: "actions" },
    ] as AccessorKeyColumnDef<{ id: string }, "id">[];
  }, [extraTableHeaders, t, common]);

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

    await execute<PutValuePositionsData>({
      path: `/admin/values/${type.toLowerCase()}/positions`,
      method: "PUT",
      data: {
        ids: list.map((v) => {
          return "createdAt" in v ? v.id : v.valueId;
        }),
      },
    });
  }

  function handleDeleteClick(value: AnyValue) {
    valueState.setTempId(value.id);
    openModal(ModalIds.AlertDeleteValue);
  }

  function handleEditClick(value: AnyValue) {
    valueState.setTempId(value.id);
    openModal(ModalIds.ManageValue);
  }

  async function handleDeleteSelected() {
    const selectedRows = getSelectedTableRows(data, tableState.rowSelection);

    const { json } = await execute<DeleteValuesBulkData>({
      path: `/admin/values/${type.toLowerCase()}/bulk-delete`,
      method: "DELETE",
      data: selectedRows,
    });

    if (json) {
      asyncTable.remove(...selectedRows.filter((id) => !json.failedIds.includes(id)));

      tableState.setRowSelection({});
      closeModal(ModalIds.AlertDeleteSelectedValues);

      toastMessage({
        title: "Delete Values",
        icon: "info",
        message: t("deletedSelectedValues", {
          failed: json.failedIds.length,
          deleted: json.success,
        }),
      });
    }
  }

  React.useEffect(() => {
    // reset form values
    if (!isOpen(ModalIds.ManageValue) && !isOpen(ModalIds.AlertDeleteValue)) {
      // timeout: wait for modal to close
      setTimeout(() => valueState.setTempId(null), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!Object.keys(ValueType).includes(path)) {
    return (
      <Layout className="dark:text-white">
        <p>Path not found</p>
      </Layout>
    );
  }

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
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
        </div>

        <div className="flex gap-2">
          {isEmpty(tableState.rowSelection) ? null : (
            <Button onPress={() => openModal(ModalIds.AlertDeleteSelectedValues)} variant="danger">
              {t("deleteSelectedValues")}
            </Button>
          )}
          <Button onPress={() => openModal(ModalIds.ManageValue)}>{typeT("ADD")}</Button>
          {/* todo: this will not properly work */}
          <OptionsDropdown type={type} values={asyncTable.items} />
        </div>
      </header>

      <SearchArea search={{ search, setSearch }} asyncTable={asyncTable} totalCount={totalCount} />

      {asyncTable.items.length <= 0 ? (
        <p className="mt-5">There are no values yet for this type.</p>
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
                      <Tooltip.Portal className="z-[999]">
                        <Tooltip.Content
                          align="center"
                          side="left"
                          sideOffset={5}
                          className="rounded-md bg-white dark:bg-tertiary dark:text-white p-4 max-w-[350px]"
                        >
                          You cannot delete this value because it is being used by another database
                          item. You must first delete that item.
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
          length: getObjLength(tableState.rowSelection),
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
  const path = (query.path as string).replace("-", "_") as Lowercase<ValueType>;

  const user = await getSessionUser(req);
  const [pathValues] = await requestAll(req, [
    [
      `/admin/values/${path}?includeAll=false`,
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
