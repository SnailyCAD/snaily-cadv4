import { useTranslations } from "use-intl";
import * as React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import compareAsc from "date-fns/compareAsc";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { Modal } from "components/modal/Modal";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { useModal } from "context/ModalContext";
import type {
  DepartmentValue,
  DivisionValue,
  DriversLicenseCategoryValue,
  EmployeeValue,
  StatusValue,
  Value,
  ValueType,
  VehicleValue,
} from "types/prisma";
import { valueType } from "types/prisma";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Input } from "components/form/Input";
import { FormField } from "components/form/FormField";
import dynamic from "next/dynamic";
import { Table } from "components/table/Table";
import { getTableDataOfType, useTableHeadersOfType } from "lib/admin/values";

const ManageValueModal = dynamic(async () => {
  return (await import("components/admin/values/ManageValueModal")).ManageValueModal;
});

export type TValue =
  | Value
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
  const [values, setValues] = React.useState<TValue[]>(data ?? []);
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

  const tableHeaders: any = React.useMemo(() => {
    return [
      { Header: "Value", accessor: "value" },
      ...extraTableHeaders,
      { Header: common("actions"), accessor: "actions" },
    ];
  }, [extraTableHeaders, common]);

  function checkMoved(list: TValue[]) {
    let wasMoved = false;

    for (let i = 0; i < values.length; i++) {
      if (values[i]?.id !== list[i]?.id) {
        wasMoved = true;
        break;
      }
    }

    /**
     * only update db if the list was actually moved.
     */
    if (wasMoved) {
      setList(list);
    }
  }

  async function setList(list: TValue[]) {
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
    openModal("deleteValue");
  }

  function handleEditClick(value: TValue) {
    setTempValue(value);
    openModal("manageValue");
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
        closeModal("deleteValue");
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
    if (!isOpen("manageValue") && !isOpen("deleteValue")) {
      // timeout: wait for modal to close
      setTimeout(() => setTempValue(null), 100);
    }
  }, [isOpen]);

  if (!Object.keys(valueType).includes(path)) {
    return (
      <Layout className="dark:text-white">
        <p>Path not found</p>
      </Layout>
    );
  }

  return (
    <AdminLayout className="dark:text-white">
      <Head>
        <title>{typeT("MANAGE")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{typeT("MANAGE")}</h1>
          <h6 className="text-lg font-semibold">
            {t("totalItems")}: <span className="font-normal">{values.length}</span>
          </h6>
        </div>
        <Button onClick={() => openModal("manageValue")}>{typeT("ADD")}</Button>
      </header>

      <FormField label={common("search")} className="my-2">
        <Input onChange={(e) => setSearch(e.target.value)} value={search} className="" />
      </FormField>

      {values.length <= 0 ? (
        <p className="mt-5">There are no values yet for this type.</p>
      ) : (
        <Table
          dragDrop={{
            enabled: true,
            handleMove: checkMoved,
          }}
          filter={search}
          data={values.map((value) => ({
            rowProps: { value },
            value: getValueStrFromValue(value),
            ...getTableDataOfType(type, value),
            actions: (
              <>
                <Button onClick={() => handleEditClick(value)} variant="success">
                  {common("edit")}
                </Button>
                <Button onClick={() => handleDeleteClick(value)} variant="danger" className="ml-2">
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={tableHeaders}
        />
      )}

      <Modal
        title={typeT("DELETE")}
        onClose={() => closeModal("deleteValue")}
        isOpen={isOpen("deleteValue")}
      >
        <p className="my-3">
          {t.rich("alert_deleteValue", {
            value:
              typeof tempValue?.value === "string" ? tempValue.value : tempValue?.value.value ?? "",
            span: (children) => {
              return <span className="font-semibold">{children}</span>;
            },
          })}
        </p>
        <div className="flex items-center justify-end gap-2 mt-2">
          <Button
            variant="cancel"
            disabled={state === "loading"}
            onClick={() => closeModal("deleteValue")}
          >
            {common("cancel")}
          </Button>
          <Button
            disabled={state === "loading"}
            className="flex items-center"
            variant="danger"
            onClick={handleDelete}
          >
            {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}{" "}
            {common("delete")}
          </Button>
        </div>
      </Modal>

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

function getValueStrFromValue(value: TValue) {
  return "createdAt" in value ? value.value : value.value.value;
}
