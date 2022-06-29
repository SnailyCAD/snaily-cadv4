import { useTranslations } from "use-intl";
import * as React from "react";
import { Button } from "components/Button";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import {
  DriversLicenseCategoryType,
  Rank,
  type DriversLicenseCategoryValue,
  type ValueType,
} from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Input } from "components/form/inputs/Input";
import { FormField } from "components/form/FormField";
import dynamic from "next/dynamic";
import { SortableList } from "components/admin/values/SortableList";
import { handleFilter } from "./[path]";
import { Title } from "components/shared/Title";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";
import { Permissions } from "@snailycad/permissions";

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

  async function setList(clType: DriversLicenseCategoryType, list: DriversLicenseCategoryValue[]) {
    setValues((p) => {
      const filtered = p.filter((v) => v.type !== clType);

      return [
        ...list.map((v, idx) => {
          const prev = p.find((a) => a.id === v.id);

          if (prev) {
            prev.value.position = idx;
          }

          return v;
        }),
        ...filtered,
      ];
    });

    await execute(`/admin/values/${type.toLowerCase()}/positions`, {
      method: "PUT",
      data: { ids: list.map((v) => v.valueId) },
    });
  }

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

    const { json } = await execute(`/admin/values/${type.toLowerCase()}/${tempValue.value.id}`, {
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
      </header>

      <FormField label={common("search")} className="my-2">
        <Input onChange={(e) => setSearch(e.target.value)} value={search} className="" />
      </FormField>

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
                onClick={() => {
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
              <SortableList
                handleDelete={handleDeleteClick.bind(null, type) as any}
                handleEdit={handleEditClick.bind(null, type) as any}
                search={search}
                values={valuesForType}
                setList={setList.bind(null, type)}
              />
            )}
          </section>
        );
      })}

      <AlertModal
        id={ModalIds.AlertDeleteValue}
        description={t.rich("alert_deleteValue", {
          value: tempValue?.value?.value.value ?? "",
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
