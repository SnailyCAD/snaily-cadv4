import { useTranslations } from "use-intl";
import * as React from "react";
import { Disclosure } from "@headlessui/react";
import Head from "next/head";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { useModal } from "context/ModalContext";
import type { Business, Citizen, User } from "types/prisma";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { AdminLayout } from "components/admin/AdminLayout";
import { ModalIds } from "types/ModalIds";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";

type FullBusiness = Business & { user: User; citizen: Pick<Citizen, "id" | "name" | "surname"> };

interface Props {
  businesses: FullBusiness[];
}

export default function ManageBusinesses({ businesses: data }: Props) {
  const [businesses, setBusinesses] = React.useState<FullBusiness[]>(data);
  const [tempValue, setTempValue] = React.useState<FullBusiness | null>(null);
  const [reason, setReason] = React.useState("");
  const reasonRef = React.useRef<HTMLInputElement>(null);

  const { state, execute } = useFetch();
  const { isOpen, openModal, closeModal } = useModal();

  const t = useTranslations("Management");
  const common = useTranslations("Common");

  function handleDeleteClick(value: FullBusiness) {
    setTempValue(value);
    openModal(ModalIds.AlertDeleteBusiness);
  }

  async function handleDelete() {
    if (!tempValue) return;

    if (!reason.trim() && reasonRef.current) {
      return reasonRef.current.focus();
    }

    try {
      const { json } = await execute(`/admin/manage/businesses/${tempValue.id}`, {
        method: "DELETE",
        data: { reason },
      });

      if (json) {
        setBusinesses((p) => p.filter((v) => v.id !== tempValue.id));
        setTempValue(null);
        closeModal(ModalIds.AlertDeleteBusiness);
      }
    } catch (err) {
      console.log({ err });
    }
  }

  React.useEffect(() => {
    setBusinesses(data);
  }, [data]);

  return (
    <AdminLayout>
      <Head>
        <title>{t("MANAGE_BUSINESSES")}</title>
      </Head>

      <h1 className="text-3xl font-semibold">{t("MANAGE_BUSINESSES")}</h1>

      {businesses.length <= 0 ? (
        <p className="mt-5">{t("noBusinesses")}</p>
      ) : (
        <ul className="mt-5">
          {businesses.map((business, idx) => (
            <li
              className="my-1 bg-gray-200 p-2 px-4 rounded-md w-full flex flex-col"
              key={business.id}
            >
              <Disclosure>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="select-none text-gray-500">{idx + 1}.</span>
                    <span className="ml-2">{business.name}</span>
                  </div>

                  <div>
                    <Disclosure.Button as={Button}>{t("viewInfo")}</Disclosure.Button>
                    <Button
                      onClick={() => handleDeleteClick(business)}
                      variant="danger"
                      className="ml-2"
                    >
                      {common("delete")}
                    </Button>
                  </div>
                </div>

                <Disclosure.Panel className="px-5">
                  <p>
                    <span className="font-semibold">{t("owner")}: </span>
                    {business.citizen.name} {business.citizen.surname}
                  </p>
                  <p>
                    <span className="font-semibold">{t("user")}: </span>
                    {business.user.username}
                  </p>
                </Disclosure.Panel>
              </Disclosure>
            </li>
          ))}
        </ul>
      )}

      <Modal
        title={t("deleteBusiness")}
        onClose={() => closeModal(ModalIds.AlertDeleteBusiness)}
        isOpen={isOpen(ModalIds.AlertDeleteBusiness)}
        className="max-w-2xl"
      >
        <div>
          <p className="my-3">
            {t.rich("alert_deleteBusiness", {
              name: tempValue && tempValue.name,
              span: (children) => {
                return <span className="font-semibold">{children}</span>;
              },
            })}
          </p>
          <FormField label="Reason">
            <Input ref={reasonRef} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
        </div>

        <div className="mt-2 flex gap-2 items-center justify-end">
          <Button
            variant="cancel"
            disabled={state === "loading"}
            onClick={() => closeModal(ModalIds.AlertDeleteBusiness)}
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
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const { data } = await handleRequest("/admin/manage/businesses", {
    headers: req.headers,
  }).catch(() => ({
    data: [],
  }));

  return {
    props: {
      businesses: data,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
