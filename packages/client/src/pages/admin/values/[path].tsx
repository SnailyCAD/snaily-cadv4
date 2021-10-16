import { useTranslations } from "use-intl";
import * as React from "react";
import { useRouter } from "next/router";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { Modal } from "components/modal/Modal";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { useModal } from "context/ModalContext";
import { EmployeeValue, StatusValue, Value, valueType, ValueType } from "types/prisma";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { ManageValueModal } from "components/admin/values/ManageValueModal";
import { AdminLayout } from "components/admin/AdminLayout";

interface Props {
  values: { type: ValueType; values: (Value | EmployeeValue | StatusValue)[] };
}

export default function ValuePath({ values: { type, values: data } }: Props) {
  const [values, setValues] = React.useState<(Value | EmployeeValue | StatusValue)[]>(data);
  const router = useRouter();
  const path = (router.query.path as string).toUpperCase().replace("-", "_");

  const [tempValue, setTempValue] = React.useState<Value | EmployeeValue | StatusValue | null>(
    null,
  );
  const { state, execute } = useFetch();

  const { isOpen, openModal, closeModal } = useModal();
  const t = useTranslations("Values");
  const typeT = useTranslations(type);
  const common = useTranslations("Common");

  function handleDeleteClick(value: Value | EmployeeValue | StatusValue) {
    setTempValue(value);
    openModal("deleteValue");
  }

  function handleEditClick(value: Value | EmployeeValue | StatusValue) {
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
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{typeT("MANAGE")}</h1>
        <Button onClick={() => openModal("manageValue")}>{typeT("ADD")}</Button>
      </header>
      {values.length <= 0 ? (
        <p className="mt-5">There are no values yet for this type.</p>
      ) : (
        <ul className="mt-5">
          {values.map((value, idx) => (
            <li
              className="my-1 bg-gray-200 p-2 px-4 rounded-md flex items-center justify-between"
              key={value.id}
            >
              <div>
                <span className="select-none text-gray-500">{++idx}.</span>
                <span className="ml-2">
                  {typeof value?.value === "string" ? value.value : value?.value.value}
                </span>
              </div>

              <div>
                <Button onClick={() => handleEditClick(value)} variant="success">
                  {common("edit")}
                </Button>
                <Button onClick={() => handleDeleteClick(value)} variant="danger" className="ml-2">
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
          setValues((p) => [...p, value]);
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

  const { data: values = [] } = await handleRequest(`/admin/values/${path}`, {
    headers: req.headers,
  }).catch(() => ({ data: [] }));

  return {
    props: {
      values: values?.[0] ?? {},
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["admin", "values", "common"], locale)),
      },
    },
  };
};
