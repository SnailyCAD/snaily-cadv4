import { useTranslations } from "use-intl";
import * as React from "react";
import { useRouter } from "next/router";
import compareAsc from "date-fns/compareAsc";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import {
  type AnyValue,
  type PenalCode,
  type PenalCodeGroup,
  ValueType,
  Rank,
} from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll, yesOrNoText } from "lib/utils";
import { Input } from "components/form/inputs/Input";
import { FormField } from "components/form/FormField";
import dynamic from "next/dynamic";
import { IndeterminateCheckbox, Table } from "components/shared/Table";
import { useTableDataOfType, useTableHeadersOfType } from "lib/admin/values";
import { OptionsDropdown } from "components/admin/values/import/OptionsDropdown";
import { Title } from "components/shared/Title";
import { AlertModal } from "components/modal/AlertModal";
import { ModalIds } from "types/ModalIds";
import { FullDate } from "components/shared/FullDate";
import { useTableSelect } from "hooks/shared/useTableSelect";
import { hasValueObj, isBaseValue } from "@snailycad/utils/typeguards";
import { valueRoutes } from "components/admin/Sidebar/routes";
import { Checkbox } from "components/form/inputs/Checkbox";
import type {
  DeleteValueByIdData,
  DeleteValuesBulkData,
  GetValuesData,
  PutValuePositionsData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

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
  const tableSelect = useTableSelect(values);
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

  const tableHeaders: any = React.useMemo(() => {
    return [
      {
        Header: (
          <IndeterminateCheckbox
            onChange={tableSelect.handleAllCheckboxes}
            checked={tableSelect.isTopCheckboxChecked}
            indeterminate={tableSelect.isIntermediate}
          />
        ),
        accessor: "checkbox",
      },
      { Header: "Value", accessor: "value" },
      ...extraTableHeaders,
      { Header: t("isDisabled"), accessor: "isDisabled" },
      { Header: common("createdAt"), accessor: "createdAt" },
      { Header: common("actions"), accessor: "actions" },
    ];
  }, [extraTableHeaders, t, common, tableSelect]);

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
    if (tableSelect.selectedRows.length <= 0) return;

    const { json } = await execute<DeleteValuesBulkData>({
      path: `/admin/values/${type.toLowerCase()}/bulk-delete`,
      method: "DELETE",
      data: tableSelect.selectedRows,
    });

    if (json && typeof json === "boolean") {
      setValues((p) => p.filter((v) => !tableSelect.selectedRows.includes(`${type}-${v.id}`)));
      tableSelect.resetRows();
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
          {tableSelect.selectedRows.length <= 0 ? null : (
            <Button onClick={() => openModal(ModalIds.AlertDeleteSelectedValues)} variant="danger">
              {t("deleteSelectedValues")}
            </Button>
          )}
          <Button onClick={() => openModal(ModalIds.ManageValue)}>{typeT("ADD")}</Button>
          <OptionsDropdown type={type} values={values} />
        </div>
      </header>

      <FormField label={common("search")} className="my-2">
        <Input onChange={(e) => setSearch(e.target.value)} value={search} />
      </FormField>

      {values.length <= 0 ? (
        <p className="mt-5">There are no values yet for this type.</p>
      ) : (
        <Table
          disabledColumnId={["checkbox"]}
          containerProps={{
            style: { overflowY: "auto", maxHeight: "75vh" },
          }}
          dragDrop={{
            enabled: true,
            handleMove: setList,
          }}
          filter={search}
          data={values.map((value) => ({
            rowProps: { value },
            checkbox: (
              <Checkbox
                checked={tableSelect.selectedRows.includes(value.id)}
                onChange={() => tableSelect.handleCheckboxChange(value)}
              />
            ),
            value: getValueStrFromValue(value),
            ...extraTableData(value),
            isDisabled: common(yesOrNoText(getDisabledFromValue(value))),
            createdAt: <FullDate>{getCreatedAtFromValue(value)}</FullDate>,
            actions: (
              <>
                <Button size="xs" onClick={() => handleEditClick(value)} variant="success">
                  {common("edit")}
                </Button>
                <Button
                  size="xs"
                  onClick={() => handleDeleteClick(value)}
                  variant="danger"
                  className="ml-2"
                >
                  {common("delete")}
                </Button>
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
          length: tableSelect.selectedRows.length,
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

export function sortValues<T extends AnyValue>(values: T[]): T[] {
  return values.sort((a, b) => {
    const { position: posA, createdAt: crA } = findCreatedAtAndPosition(a);
    const { position: posB, createdAt: crB } = findCreatedAtAndPosition(b);

    return typeof posA === "number" && typeof posB === "number"
      ? posA - posB
      : compareAsc(crA, crB);
  });
}

export function findCreatedAtAndPosition(value: AnyValue) {
  if (isBaseValue(value)) {
    return {
      createdAt: new Date(value.createdAt),
      position: value.position,
    };
  }

  if (hasValueObj(value)) {
    return {
      createdAt: new Date(value.value.createdAt),
      position: value.value.position,
    };
  }

  return {
    createdAt: new Date(value.createdAt),
    position: value.position,
  };
}

export function handleFilter(value: AnyValue, search: string) {
  if (!search) return true;
  const str = isBaseValue(value) ? value.value : hasValueObj(value) ? value.value.value : "";

  if (str.toLowerCase().includes(search.toLowerCase())) return true;
  return false;
}

export function getValueStrFromValue(value: AnyValue) {
  const isBase = isBaseValue(value);
  const hasObj = hasValueObj(value);
  return isBase ? value.value : hasObj ? value.value.value : value.title;
}

export function getCreatedAtFromValue(value: AnyValue) {
  const isBase = isBaseValue(value);
  const hasObj = hasValueObj(value);
  return isBase ? value.createdAt : hasObj ? value.value.createdAt : value.createdAt;
}

export function getDisabledFromValue(value: AnyValue) {
  const isBase = isBaseValue(value);
  const hasObj = hasValueObj(value);
  return isBase ? value.isDisabled : hasObj ? value.value.isDisabled : false;
}

/**
 * only update db if the list was actually moved.
 */
export function hasTableDataChanged(
  prevList: (AnyValue | PenalCode | PenalCodeGroup)[],
  newList: (AnyValue | PenalCode | PenalCodeGroup)[],
) {
  let wasMoved = false;

  for (let i = 0; i < prevList.length; i++) {
    if (prevList[i]?.id !== newList[i]?.id) {
      wasMoved = true;
      break;
    }
  }

  return wasMoved;
}
