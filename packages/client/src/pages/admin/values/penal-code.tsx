import { useTranslations } from "use-intl";
import * as React from "react";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { useModal } from "context/ModalContext";
import { PenalCode, ValueType } from "types/prisma";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import dynamic from "next/dynamic";
import Head from "next/head";

const ManagePenalCode = dynamic(async () => {
  return (await import("components/admin/values/ManagePenalCode")).ManagePenalCode;
});

interface Props {
  values: { type: ValueType; values: PenalCode[] };
}

export default function ValuePath({ values: { type, values: data } }: Props) {
  const [values, setValues] = React.useState<PenalCode[]>(data);

  const [tempValue, setTempValue] = React.useState<PenalCode | null>(null);
  const { state, execute } = useFetch();

  const { isOpen, openModal, closeModal } = useModal();
  const t = useTranslations("Values");
  const typeT = useTranslations(type);
  const common = useTranslations("Common");

  function handleDeleteClick(value: PenalCode) {
    setTempValue(value);
    openModal("deleteValue");
  }

  function handleEditClick(value: PenalCode) {
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

  return (
    <AdminLayout className="dark:text-white">
      <Head>
        <title>{typeT("MANAGE")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{typeT("MANAGE")}</h1>
        <Button onClick={() => openModal("manageValue")}>{typeT("ADD")}</Button>
      </header>
      {values.length <= 0 ? (
        <p className="mt-5">There are no penal codes yet.</p>
      ) : (
        <ul className="mt-5">
          {values.map((value, idx) => (
            <li
              className="flex items-center justify-between p-2 px-4 my-1 bg-gray-200 rounded-md dark:bg-gray-2"
              key={value.id}
            >
              <div>
                <span className="text-gray-500 select-none">{++idx}.</span>
                <span className="ml-2">{value.title}</span>

                <p className="mt-2 ml-5">{value.description}</p>

                {value.warningApplicable ? (
                  <div className="mt-3 ml-5">
                    <p>
                      <span className="font-semibold">Fines: </span>
                      {value.warningApplicable.fines.map(Intl.NumberFormat().format).join(" - ") ||
                        common("none")}
                    </p>
                  </div>
                ) : value.warningNotApplicable ? (
                  <div className="mt-3 ml-5">
                    <p>
                      <span className="font-semibold">Fines: </span>
                      {value.warningNotApplicable.fines
                        .map(Intl.NumberFormat().format)
                        .join(" - ") || common("none")}
                    </p>
                    <p>
                      <span className="font-semibold">Prison Term: </span>
                      {value.warningNotApplicable.prisonTerm
                        .map(Intl.NumberFormat().format)
                        .join(" - ") || common("none")}
                    </p>
                    <p>
                      <span className="font-semibold">Bail: </span>
                      {value.warningNotApplicable.bail
                        .map(Intl.NumberFormat().format)
                        .join(" - ") || common("none")}
                    </p>
                  </div>
                ) : null}
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
            value: tempValue?.title,
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

      <ManagePenalCode
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
        penalCode={tempValue}
        type={type}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [values] = await requestAll(req, [["/admin/values/penal_code", []]]);

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
