import { useTranslations } from "use-intl";
import * as React from "react";
import { useRouter } from "next/router";
import { Button, TextField } from "@snailycad/ui";
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
import { Table, useTableState } from "components/shared/Table";
import { useTableDataOfType, useTableHeadersOfType } from "lib/admin/values/values";
import { OptionsDropdown } from "components/admin/values/import/OptionsDropdown";
import { Title } from "components/shared/Title";
import { AlertModal } from "components/modal/AlertModal";
import { ModalIds } from "types/ModalIds";
import { FullDate } from "components/shared/FullDate";
import { hasValueObj, isBaseValue } from "@snailycad/utils/typeguards";
import { valueRoutes } from "components/admin/Sidebar/routes";
import type {
  DeleteValueByIdData,
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
import { getSelectedTableRows } from "hooks/shared/table/useTableState";

const ManageValueModal = dynamic(async () => {
  return (await import("components/admin/values/ManageValueModal")).ManageValueModal;
});

const ImportValuesModal = dynamic(async () => {
  return (await import("components/admin/values/import/ImportValuesModal")).ImportValuesModal;
});

interface Props {
  pathValues: GetValuesData[number];
}

export default function ValuePath({ pathValues: { type, values: data } }: Props) {
  const [values, setValues] = React.useState<AnyValue[]>(data);
  const router = useRouter();
  const path = (router.query.path as string).toUpperCase().replace("-", "_");
  const routeData = valueRoutes.find((v) => v.type === type);

  const [search, setSearch] = React.useState("");
  const [tempValue, valueState] = useTemporaryItem(values);
  const { state, execute } = useFetch();

  const { isOpen, openModal, closeModal } = useModal();
  const t = useTranslations("Values");
  const typeT = useTranslations(type);
  const common = useTranslations("Common");

  const extraTableHeaders = useTableHeadersOfType(type);
  const extraTableData = useTableDataOfType(type);
  const tableState = useTableState({
    dragDrop: { onListChange: setList },
    search: { value: search, setValue: setSearch },
  });

  const tableHeaders = React.useMemo(() => {
    return [
      { header: "Value", accessorKey: "value" },
      ...extraTableHeaders,
      { header: t("isDisabled"), accessorKey: "isDisabled" },
      { header: common("createdAt"), accessorKey: "createdAt" },
      { header: common("actions"), accessorKey: "actions" },
    ] as AccessorKeyColumnDef<{ id: string }>[];
  }, [extraTableHeaders, t, common]);

  async function setList(list: AnyValue[]) {
    if (!hasTableDataChanged(values, list)) return;

    setValues((p) =>
      list.map((v, idx) => {
        const prev = p.find((a) => a.id === v.id);

        if (prev) {
          if ("position" in prev) {
            prev.position = idx;
          } else {
            prev.value.position = idx;
          }
        }

        return v;
      }),
    );

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

  async function handleDelete() {
    if (!tempValue) return;

    const { json } = await execute<DeleteValueByIdData>({
      path: `/admin/values/${type.toLowerCase()}/${tempValue.id}`,
      method: "DELETE",
    });

    if (json) {
      setValues((p) => p.filter((v) => v.id !== tempValue.id));
      valueState.setTempId(null);
      closeModal(ModalIds.AlertDeleteValue);
    }
  }

  async function handleDeleteSelected() {
    const selectedRows = getSelectedTableRows(data, tableState.rowSelection);

    const { json } = await execute<DeleteValuesBulkData>({
      path: `/admin/values/${type.toLowerCase()}/bulk-delete`,
      method: "DELETE",
      data: selectedRows,
    });

    if (json && typeof json === "boolean") {
      setValues((p) => p.filter((v) => !selectedRows.includes(v.id)));
      tableState.setRowSelection({});
      closeModal(ModalIds.AlertDeleteSelectedValues);
    }
  }

  React.useEffect(() => {
    setValues(data);
  }, [data]);

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
            {t("totalItems")}: <span className="font-normal">{values.length}</span>
          </h2>
        </div>

        <div className="flex gap-2">
          {isEmpty(tableState.rowSelection) ? null : (
            <Button onPress={() => openModal(ModalIds.AlertDeleteSelectedValues)} variant="danger">
              {t("deleteSelectedValues")}
            </Button>
          )}
          <Button onPress={() => openModal(ModalIds.ManageValue)}>{typeT("ADD")}</Button>
          <OptionsDropdown type={type} values={values} />
        </div>
      </header>

      <TextField
        label={common("search")}
        className="my-2"
        name="search"
        value={search}
        onChange={(value) => setSearch(value)}
      />

      {values.length <= 0 ? (
        <p className="mt-5">There are no values yet for this type.</p>
      ) : (
        <Table
          tableState={tableState}
          features={{ dragAndDrop: true, rowSelection: true }}
          containerProps={{
            style: { overflowY: "auto", maxHeight: "75vh" },
          }}
          data={values.map((value) => ({
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

      <AlertModal
        id={ModalIds.AlertDeleteValue}
        description={t.rich("alert_deleteValue", {
          value:
            tempValue &&
            (isBaseValue(tempValue)
              ? tempValue.value
              : hasValueObj(tempValue)
              ? tempValue.value.value
              : tempValue.title),
          span: (children) => {
            return <span className="font-semibold">{children}</span>;
          },
        })}
        onDeleteClick={handleDelete}
        title={typeT("DELETE")}
        state={state}
        onClose={() => {
          // wait for animation to play out
          setTimeout(() => valueState.setTempId(null), 100);
        }}
      />

      <AlertModal
        id={ModalIds.AlertDeleteSelectedValues}
        description={t.rich("alert_deleteSelectedValues", {
          length: getObjLength(tableState.rowSelection),
        })}
        onDeleteClick={handleDeleteSelected}
        title={typeT("DELETE")}
        state={state}
      />

      <ManageValueModal
        onCreate={(value) => {
          setValues((p) => [value, ...p]);
        }}
        onUpdate={(old, newV) => {
          setValues((p) => {
            const idx = p.indexOf(old);
            p[idx] = newV;

            return p;
          });
        }}
        value={tempValue}
        type={type}
      />
      <ImportValuesModal onImport={(data) => setValues((p) => [...data, ...p])} type={type} />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req, query }) => {
  const path = (query.path as string).replace("-", "_") as Lowercase<ValueType>;

  const pathsRecord: Partial<Record<Lowercase<ValueType>, string>> = {
    department: "officer_rank",
    division: "department",
    qualification: "department",
    codes_10: "department",
    officer_rank: "department",
  };

  const paths = pathsRecord[path];
  const pathsStr = paths ? `?paths=${paths}` : "";

  const user = await getSessionUser(req);
  const [values] = await requestAll(req, [[`/admin/values/${path}${pathsStr}`, []]]);

  return {
    props: {
      values,
      pathValues: values?.[0] ?? { type: path, values: [] },
      session: user,
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
    },
  };
};
