import { useTranslations } from "use-intl";
import * as React from "react";
import Head from "next/head";
import { ReactSortable } from "react-sortablejs";
import { ArrowsExpand } from "react-bootstrap-icons";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { useModal } from "context/ModalContext";
import { DriversLicenseCategoryType, DriversLicenseCategoryValue, ValueType } from "types/prisma";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Input } from "components/form/Input";
import { FormField } from "components/form/FormField";
import { handleFilter, sortValues } from "./[path]";
import dynamic from "next/dynamic";

const ManageValueModal = dynamic(async () => {
  return (await import("components/admin/values/ManageValueModal")).ManageValueModal;
});

export type TValue = DriversLicenseCategoryValue;

interface Props {
  pathValues: { type: ValueType; values: DriversLicenseCategoryValue[] };
}

export default function DriversLicenseCategories({ pathValues: { type, values: data } }: Props) {
  const [values, setValues] = React.useState<TValue[]>(data);
  const [search, setSearch] = React.useState("");
  const [tempValue, setTempValue] = React.useState<{
    value: TValue | null;
    type: DriversLicenseCategoryType | null;
  }>({} as any);
  const { state, execute } = useFetch();

  const { isOpen, openModal, closeModal } = useModal();
  const t = useTranslations("Values");
  const typeT = useTranslations(type);
  const common = useTranslations("Common");

  async function setList(clType: DriversLicenseCategoryType, list: TValue[]) {
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
      data: {
        ids: list.map((v) => {
          return "createdAt" in v ? v.id : v.valueId;
        }),
      },
    });
  }

  function handleDeleteClick(type: DriversLicenseCategoryType, value: TValue) {
    setTempValue({ value, type });
    openModal("deleteValue");
  }

  function handleEditClick(type: DriversLicenseCategoryType, value: TValue) {
    setTempValue({ value, type });
    openModal("manageValue");
  }

  async function handleDelete() {
    if (!tempValue.value || !tempValue.type) return;

    try {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${tempValue.value.id}`, {
        method: "DELETE",
      });

      if (json) {
        setValues((p) => p.filter((v) => v.id !== tempValue.value?.id));
        setTempValue({ value: null, type: null });
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
      setTimeout(() => setTempValue({ value: null, type: null }), 100);
    }
  }, [isOpen]);

  return (
    <AdminLayout>
      <Head>
        <title>{typeT("MANAGE")} - SnailyCAD</title>
      </Head>

      <header className="flex flex-col">
        <h1 className="text-3xl font-semibold">{typeT("MANAGE")}</h1>
        <h6 className="text-lg font-semibold">
          {t("totalItems")}: <span className="font-normal">{values.length}</span>
        </h6>
      </header>

      <FormField label={common("search")} className="my-2">
        <Input onChange={(e) => setSearch(e.target.value)} value={search} className="" />
      </FormField>

      {Object.values(DriversLicenseCategoryType).map((type) => {
        const valuesForType = values.filter((v) => v.type === type);

        return (
          <section className="my-4 mb-6" key={type}>
            <header className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{type}</h3>

              <Button
                onClick={() => {
                  openModal("manageValue");
                  setTempValue((p) => ({ ...p, type }));
                }}
              >
                {typeT("ADD")}
              </Button>
            </header>

            {valuesForType.length <= 0 ? (
              <p className="mt-3">There are no values yet for this type.</p>
            ) : (
              <List
                handleDelete={handleDeleteClick.bind(null, type)}
                handleEdit={handleEditClick.bind(null, type)}
                search={search}
                values={valuesForType}
                setList={setList.bind(null, type)}
              />
            )}
          </section>
        );
      })}

      <Modal
        title={typeT("DELETE")}
        onClose={() => closeModal("deleteValue")}
        isOpen={isOpen("deleteValue")}
      >
        <p className="my-3">
          {t.rich("alert_deleteValue", {
            value:
              typeof tempValue?.value?.value === "string"
                ? tempValue?.value?.value
                : tempValue?.value?.value?.value,
            span: (children) => {
              return <span className="font-semibold">{children}</span>;
            },
          })}
        </p>
        <div className="mt-2 flex gap-2 items-center justify-end">
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
            {state === "loading" ? <Loader className="border-red-200 mr-2" /> : null}{" "}
            {common("delete")}
          </Button>
        </div>
      </Modal>

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
        clType={tempValue.type}
        value={tempValue.value}
        type={type}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [values] = await requestAll(req, [["/admin/values/driverslicense_category", []]]);

  return {
    props: {
      values,
      pathValues: values?.[0] ?? {},
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["admin", "values", "common"], locale)),
      },
    },
  };
};

interface ListProps {
  values: DriversLicenseCategoryValue[];
  search: string;
  setList: any;
  handleEdit: (value: DriversLicenseCategoryValue) => void;
  handleDelete: (value: DriversLicenseCategoryValue) => void;
}

const List = ({ values, search, setList, handleEdit, handleDelete }: ListProps) => {
  const common = useTranslations("Common");

  return (
    <ReactSortable animation={200} className="mt-5" tag="ul" list={values} setList={setList}>
      {sortValues(values)
        .filter((v) => handleFilter(v, search))
        .map((value, idx) => (
          <li
            className="my-1 bg-gray-200 p-2 px-4 rounded-md flex items-center justify-between"
            key={value.id}
          >
            <div className="flex items-center">
              <span className="cursor-move">
                <ArrowsExpand className="text-gray-500 mr-2" width={15} />
              </span>

              <span className="select-none text-gray-500">{++idx}.</span>
              <span className="ml-2">
                {typeof value.value !== "string" && value.value.type === "DIVISION" ? (
                  <span>{(value as any).department.value?.value} / </span>
                ) : null}
                {typeof value.value === "string" ? value.value : value.value.value}
              </span>
            </div>

            <div>
              <Button onClick={() => handleEdit(value)} variant="success">
                {common("edit")}
              </Button>
              <Button onClick={() => handleDelete(value)} variant="danger" className="ml-2">
                {common("delete")}
              </Button>
            </div>
          </li>
        ))}
    </ReactSortable>
  );
};
