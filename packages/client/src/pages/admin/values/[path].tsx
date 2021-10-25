import { useTranslations } from "use-intl";
import * as React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { Modal } from "components/modal/Modal";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { useModal } from "context/ModalContext";
import {
  DivisionValue,
  EmployeeValue,
  StatusValue,
  Value,
  valueType,
  ValueType,
} from "types/prisma";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { ManageValueModal } from "components/admin/values/ManageValueModal";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import compareAsc from "date-fns/compareAsc";

type TValue = Value | EmployeeValue | StatusValue | DivisionValue;

interface Props {
  pathValues: { type: ValueType; values: TValue[] };
}

export default function ValuePath({ pathValues: { type, values: data } }: Props) {
  const [values, setValues] = React.useState<TValue[]>(data);
  const router = useRouter();
  const path = (router.query.path as string).toUpperCase().replace("-", "_");

  const [tempValue, setTempValue] = React.useState<TValue | null>(null);
  const { state, execute } = useFetch();

  const { isOpen, openModal, closeModal } = useModal();
  const t = useTranslations("Values");
  const typeT = useTranslations(type);
  const common = useTranslations("Common");

  function findCreatedAt(value: TValue) {
    if ("createdAt" in value) {
      return new Date(value.createdAt);
    }

    return new Date(value.value.createdAt);
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
      <Layout>
        <p>Path not found</p>
      </Layout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>{typeT("MANAGE")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{typeT("MANAGE")}</h1>
        <Button onClick={() => openModal("manageValue")}>{typeT("ADD")}</Button>
      </header>
      {values.length <= 0 ? (
        <p className="mt-5">There are no values yet for this type.</p>
      ) : (
        <ul className="mt-5">
          {values
            .sort((a, b) => compareAsc(findCreatedAt(a), findCreatedAt(b)))
            .map((value, idx) => (
              <li
                className="my-1 bg-gray-200 p-2 px-4 rounded-md flex items-center justify-between"
                key={value.id}
              >
                <div>
                  <span className="select-none text-gray-500">{++idx}.</span>
                  <span className="ml-2">
                    {typeof value.value !== "string" && value.value.type === "DIVISION" ? (
                      <span>{(value as any).department.value} / </span>
                    ) : null}
                    {typeof value.value === "string" ? value.value : value.value.value}
                  </span>
                </div>

                <div>
                  <Button onClick={() => handleEditClick(value)} variant="success">
                    {common("edit")}
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(value)}
                    variant="danger"
                    className="ml-2"
                  >
                    {common("delete")}
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      )}

      <Modal
        title={typeT("DELETE")}
        onClose={() => closeModal("deleteValue")}
        isOpen={isOpen("deleteValue")}
      >
        <p className="my-3">
          {t.rich("alert_deleteValue", {
            value: typeof tempValue?.value === "string" ? tempValue.value : tempValue?.value.value,
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
      pathValues: values?.[0] ?? {},
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["admin", "values", "common"], locale)),
      },
    },
  };
};
