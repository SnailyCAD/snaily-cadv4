import { useTranslations } from "use-intl";
import * as React from "react";
import { Button, TextField } from "@snailycad/ui";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import {
  DriversLicenseCategoryType,
  Rank,
  ValueType,
  type DriversLicenseCategoryValue,
} from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll, yesOrNoText } from "lib/utils";
import dynamic from "next/dynamic";
import { Title } from "components/shared/Title";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";
import { Permissions } from "@snailycad/permissions";
import type { DeleteValueByIdData, PutValuePositionsData } from "@snailycad/types/api";
import {
  getCreatedAtFromValue,
  getDisabledFromValue,
  getValueStrFromValue,
  handleFilter,
  hasTableDataChanged,
} from "lib/admin/values/utils";
import { Table, useTableState } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { createValueDocumentationURL } from "./[path]";
import { BoxArrowUpRight } from "react-bootstrap-icons";
import Link from "next/link";

const ManageValueModal = dynamic(async () => {
  return (await import("components/admin/values/ManageValueModal")).ManageValueModal;
});

interface Props {
  pathValues: { type: ValueType; values: DriversLicenseCategoryValue[] };
}

export default function DriversLicenseCategories({ pathValues: { type, values: data } }: Props) {
  const [values, setValues] = React.useState<DriversLicenseCategoryValue[]>(data);
  const [search, setSearch] = React.useState("");
  const [tempValue, setTempValue] = React.useState<{
    value: DriversLicenseCategoryValue | null;
    type: DriversLicenseCategoryType | null;
  } | null>(null);
  const { state, execute } = useFetch();

  const { isOpen, openModal, closeModal } = useModal();
  const t = useTranslations("Values");
  const typeT = useTranslations(type);
  const common = useTranslations("Common");

  function handleDeleteClick(type: DriversLicenseCategoryType, value: DriversLicenseCategoryValue) {
    setTempValue({ value, type });
    openModal(ModalIds.AlertDeleteValue);
  }

  function handleEditClick(type: DriversLicenseCategoryType, value: DriversLicenseCategoryValue) {
    setTempValue({ value, type });
    openModal(ModalIds.ManageValue);
  }

  async function handleDelete() {
    if (!tempValue?.value || !tempValue.type) return;

    const { json } = await execute<DeleteValueByIdData>({
      path: `/admin/values/${type.toLowerCase()}/${tempValue.value.id}`,
      method: "DELETE",
    });

    if (json) {
      setValues((p) => p.filter((v) => v.id !== tempValue.value?.id));
      setTempValue({ value: null, type: null });
      closeModal(ModalIds.AlertDeleteValue);
    }
  }

  React.useEffect(() => {
    setValues(data);
  }, [data]);

  React.useEffect(() => {
    // reset form values
    if (!isOpen(ModalIds.ManageValue) && !isOpen(ModalIds.AlertDeleteValue)) {
      // timeout: wait for modal to close
      setTimeout(() => setTempValue({ value: null, type: null }), 100);
    }
  }, [isOpen]);

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageValueDLCategory],
      }}
    >
      <header className="flex flex-col">
        <Title className="!mb-0">{typeT("MANAGE")}</Title>
        <h2 className="text-lg font-semibold">
          {t("totalItems")}: <span className="font-normal">{values.length}</span>
        </h2>
        <Link
          className="mt-1 underline flex items-center gap-1 text-blue-500"
          target="_blank"
          href={createValueDocumentationURL(ValueType.DRIVERSLICENSE_CATEGORY)}
        >
          {common("learnMore")}
          <BoxArrowUpRight className="inline-block" />
        </Link>
      </header>

      <TextField
        label={common("search")}
        className="my-2"
        name="search"
        value={search}
        onChange={(value) => setSearch(value)}
      />

      {Object.values(DriversLicenseCategoryType).map((type) => {
        const valuesForType = values.filter((v) => v.type === type);

        if (search && valuesForType.filter((v) => handleFilter(v, search)).length <= 0) {
          return null;
        }

        return (
          <section className="my-4 mb-6" key={type}>
            <header className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{type}</h3>

              <Button
                onPress={() => {
                  openModal(ModalIds.ManageValue);
                  setTempValue((p) => p && { ...p, type });
                }}
              >
                {typeT("ADD")}
              </Button>
            </header>

            {valuesForType.length <= 0 ? (
              <p className="mt-3">There are no values yet for this type.</p>
            ) : (
              <TableList
                handleDelete={handleDeleteClick.bind(null, type) as any}
                handleEdit={handleEditClick.bind(null, type) as any}
                type={type}
                values={valuesForType}
              />
            )}
          </section>
        );
      })}

      <AlertModal
        id={ModalIds.AlertDeleteValue}
        description={t.rich("alert_deleteValue", {
          value: tempValue?.value?.value.value ?? "",
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
        onCreate={(value: any) => {
          setValues((p) => [value, ...p]);
        }}
        onUpdate={(old: any, newV: any) => {
          setValues((p) => {
            const idx = p.indexOf(old);
            p[idx] = newV;

            return p;
          });
        }}
        clType={tempValue?.type}
        value={tempValue?.value ?? null}
        type={type}
      />
    </AdminLayout>
  );
}

function TableList(props: {
  type: DriversLicenseCategoryType;
  values: DriversLicenseCategoryValue[];
  handleDelete(value: DriversLicenseCategoryValue): void;
  handleEdit(value: DriversLicenseCategoryValue): void;
}) {
  const [values, setValues] = React.useState(props.values);
  const { execute } = useFetch();
  const common = useTranslations("Common");
  const tableState = useTableState({ dragDrop: { onListChange: setList } });

  React.useEffect(() => {
    setValues(props.values);
  }, [props.values]);

  async function setList(list: DriversLicenseCategoryValue[]) {
    if (!hasTableDataChanged(values, list)) return;

    setValues((p) =>
      list.map((v, idx) => {
        const prev = p.find((a) => a.id === v.id);

        if (prev) {
          prev.value.position = idx;
        }

        return v;
      }),
    );

    await execute<PutValuePositionsData>({
      path: "/admin/values/driverslicense_category/positions",
      method: "PUT",
      data: {
        ids: list.map((v) => {
          return v.valueId;
        }),
      },
    });
  }

  return (
    <Table
      features={{ dragAndDrop: true }}
      tableState={tableState}
      data={values.map((value) => ({
        id: value.id,
        rowProps: { value },
        value: getValueStrFromValue(value),
        description: value.description || common("none"),
        isDisabled: common(yesOrNoText(getDisabledFromValue(value))),
        createdAt: <FullDate>{getCreatedAtFromValue(value)}</FullDate>,
        actions: (
          <>
            <Button size="xs" onPress={() => props.handleEdit(value)} variant="success">
              {common("edit")}
            </Button>

            <Button
              size="xs"
              onPress={() => props.handleDelete(value)}
              variant="danger"
              className="ml-2"
              // disabled={isValueInUse(value)}
            >
              {common("delete")}
            </Button>
          </>
        ),
      }))}
      columns={[
        { header: "Value", accessorKey: "value" },
        { header: "Description", accessorKey: "description" },
        { header: "Created At", accessorKey: "createdAt" },
        { header: "Disabled", accessorKey: "isDisabled" },
        { header: "Actions", accessorKey: "actions" },
      ]}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [values] = await requestAll(req, [["/admin/values/driverslicense_category", []]]);

  return {
    props: {
      values,
      pathValues: values?.[0] ?? {},
      session: user,
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
    },
  };
};
