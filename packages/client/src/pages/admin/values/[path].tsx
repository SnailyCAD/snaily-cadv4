import { useTranslations } from "use-intl";
import * as React from "react";
import { useRouter } from "next/router";
import compareAsc from "date-fns/compareAsc";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "context/ModalContext";
import {
  type DepartmentValue,
  type DivisionValue,
  type DriversLicenseCategoryValue,
  type EmployeeValue,
  type PenalCode,
  type PenalCodeGroup,
  type StatusValue,
  type Value,
  type VehicleValue,
  ValueType,
} from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Input } from "components/form/inputs/Input";
import { FormField } from "components/form/FormField";
import dynamic from "next/dynamic";
import { Table } from "components/shared/Table";
import { useTableDataOfType, useTableHeadersOfType } from "lib/admin/values";
import { OptionsDropdown } from "components/admin/values/import/OptionsDropdown";
import { Title } from "components/shared/Title";
import { AlertModal } from "components/modal/AlertModal";
import { ModalIds } from "types/ModalIds";
import { FullDate } from "components/shared/FullDate";

const ManageValueModal = dynamic(async () => {
  return (await import("components/admin/values/ManageValueModal")).ManageValueModal;
});

const ImportValuesModal = dynamic(async () => {
  return (await import("components/admin/values/import/ImportValuesModal")).ImportValuesModal;
});

export type TValue =
  | Value<ValueType>
  | EmployeeValue
  | StatusValue
  | DivisionValue
  | DepartmentValue
  | DriversLicenseCategoryValue
  | VehicleValue;

interface Props {
  pathValues: { type: ValueType; values: TValue[] };
}

export default function ValuePath({ pathValues: { type, values: data } }: Props) {
  const [values, setValues] = React.useState<TValue[]>(data);
  const router = useRouter();
  const path = (router.query.path as string).toUpperCase().replace("-", "_");

  const [search, setSearch] = React.useState("");
  const [tempValue, setTempValue] = React.useState<TValue | null>(null);
  const { state, execute } = useFetch();

  const { isOpen, openModal, closeModal } = useModal();
  const t = useTranslations("Values");
  const typeT = useTranslations(type);
  const common = useTranslations("Common");

  const extraTableHeaders = useTableHeadersOfType(type);
  const extraTableData = useTableDataOfType(type);

  const tableHeaders: any = React.useMemo(() => {
    return [
      { Header: "Value", accessor: "value" },
      ...extraTableHeaders,
      { Header: common("createdAt"), accessor: "createdAt" },
      { Header: common("actions"), accessor: "actions" },
    ];
  }, [extraTableHeaders, common]);

  async function setList(list: TValue[]) {
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

    await execute(`/admin/values/${type.toLowerCase()}/positions`, {
      method: "PUT",
      data: {
        ids: list.map((v) => {
          return "createdAt" in v ? v.id : v.valueId;
        }),
      },
    });
  }

  function handleDeleteClick(value: TValue) {
    setTempValue(value);
    openModal(ModalIds.AlertDeleteValue);
  }

  function handleEditClick(value: TValue) {
    setTempValue(value);
    openModal(ModalIds.ManageValue);
  }

  async function handleDelete() {
    if (!tempValue) return;

    try {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${tempValue.id}`, {
        method: "DELETE",
      });

      if (json) {
        setValues((p) => p.filter((v) => v.id !== tempValue.id));
        setTempValue(null);
        closeModal(ModalIds.AlertDeleteValue);
      }
    } catch (err) {
      console.log({ err });
    }
  }

  React.useEffect(() => {
    setValues(data);
  }, [data]);

  React.useEffect(() => {
    // reset form values
    if (!isOpen(ModalIds.ManageValue) && !isOpen(ModalIds.AlertDeleteValue)) {
      // timeout: wait for modal to close
      setTimeout(() => setTempValue(null), 100);
    }
  }, [isOpen]);

  if (!Object.keys(ValueType).includes(path)) {
    return (
      <Layout className="dark:text-white">
        <p>Path not found</p>
      </Layout>
    );
  }

  return (
    <AdminLayout>
      <Title>{typeT("MANAGE")}</Title>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{typeT("MANAGE")}</h1>
          <h6 className="text-lg font-semibold">
            {t("totalItems")}: <span className="font-normal">{values.length}</span>
          </h6>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => openModal(ModalIds.ManageValue)}>{typeT("ADD")}</Button>
          <OptionsDropdown values={values} />
        </div>
      </header>

      <FormField label={common("search")} className="my-2">
        <Input onChange={(e) => setSearch(e.target.value)} value={search} className="" />
      </FormField>

      {values.length <= 0 ? (
        <p className="mt-5">There are no values yet for this type.</p>
      ) : (
        <Table
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
            value: getValueStrFromValue(value),
            ...extraTableData(value),
            createdAt: <FullDate>{getCreatedAtFromValue(value)}</FullDate>,
            actions: (
              <>
                <Button small onClick={() => handleEditClick(value)} variant="success">
                  {common("edit")}
                </Button>
                <Button
                  small
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
            typeof tempValue?.value === "string" ? tempValue.value : tempValue?.value.value ?? "",
          span: (children) => {
            return <span className="font-semibold">{children}</span>;
          },
        })}
        onDeleteClick={handleDelete}
        title={typeT("DELETE")}
        state={state}
        onClose={() => {
          // wait for animation to play out
          setTimeout(() => setTempValue(null), 100);
        }}
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
  const path = (query.path as string).replace("-", "_");

  const [values] = await requestAll(req, [[`/admin/values/${path}?paths=department`, []]]);

  return {
    props: {
      values,
      pathValues: values?.[0] ?? { type: path, values: [] },
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "values", "common"], locale)),
      },
    },
  };
};

export function sortValues(values: TValue[]): any[] {
  return values.sort((a, b) => {
    const { position: posA, createdAt: crA } = findCreatedAtAndPosition(a);
    const { position: posB, createdAt: crB } = findCreatedAtAndPosition(b);

    return typeof posA === "number" && typeof posB === "number"
      ? posA - posB
      : compareAsc(crA, crB);
  });
}

export function findCreatedAtAndPosition(value: TValue) {
  if ("position" in value) {
    return {
      createdAt: new Date(value.createdAt),
      position: value.position,
    };
  }

  return {
    createdAt: new Date(value.value.createdAt),
    position: value.value.position,
  };
}

export function handleFilter(value: TValue, search: string) {
  if (!search) return true;
  const str = "createdAt" in value ? value.value : value.value.value;

  if (str.toLowerCase().includes(search.toLowerCase())) return true;
  return false;
}

export function getValueStrFromValue(value: TValue) {
  return "createdAt" in value ? value.value : value.value.value;
}

export function getCreatedAtFromValue(value: TValue) {
  return "createdAt" in value ? value.createdAt : value.value.createdAt;
}

/**
 * only update db if the list was actually moved.
 */
export function hasTableDataChanged(
  prevList: (TValue | PenalCode | PenalCodeGroup)[],
  newList: (TValue | PenalCode | PenalCodeGroup)[],
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
