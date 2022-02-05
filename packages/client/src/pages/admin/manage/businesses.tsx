import { useTranslations } from "use-intl";
import * as React from "react";
import { TabsContent, TabList } from "components/shared/TabList";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "context/ModalContext";
import { type Business, type Citizen, type User, WhitelistStatus } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { AdminLayout } from "components/admin/AdminLayout";
import { ModalIds } from "types/ModalIds";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { requestAll, yesOrNoText } from "lib/utils";
import { PendingBusinessesTab } from "components/admin/manage/business/PendingBusinessesTab";
import { useAuth } from "context/AuthContext";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";

export type FullBusiness = Business & {
  user: User;
  citizen: Pick<Citizen, "id" | "name" | "surname">;
};

interface Props {
  businesses: FullBusiness[];
}

export default function ManageBusinesses({ businesses: data }: Props) {
  const [businesses, setBusinesses] = React.useState<FullBusiness[]>(data);
  const [tempValue, setTempValue] = React.useState<FullBusiness | null>(null);
  const [reason, setReason] = React.useState("");
  const reasonRef = React.useRef<HTMLInputElement>(null);
  const { cad } = useAuth();

  const { state, execute } = useFetch();
  const { isOpen, openModal, closeModal } = useModal();

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const businessWhitelisted = cad?.businessWhitelisted ?? false;
  const pendingBusinesses = businesses.filter((v) => v.status === WhitelistStatus.PENDING);

  const TABS = [
    {
      name: t("allBusinesses"),
      value: "allBusinesses",
    },
    {
      name: `${t("pendingBusinesses")} (${pendingBusinesses.length})`,
      value: "pendingBusinesses",
    },
  ];

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
      <Title>{t("MANAGE_BUSINESSES")}</Title>

      <h1 className="text-3xl font-semibold mb-5">{t("MANAGE_BUSINESSES")}</h1>

      <TabList tabs={businessWhitelisted ? TABS : TABS.splice(0, 1)}>
        <TabsContent aria-label={t("allBusinesses")} value="allBusinesses">
          <h2 className="text-2xl font-semibold mb-2">{t("allBusinesses")}</h2>

          {businesses.length <= 0 ? (
            <p className="mt-5">{t("noBusinesses")}</p>
          ) : (
            <Table
              defaultSort={
                businessWhitelisted
                  ? {
                      columnId: "status",
                      descending: false,
                    }
                  : undefined
              }
              data={businesses.map((business) => ({
                name: business.name,
                owner: `${business.citizen.name} ${business.citizen.surname}`,
                user: business.user.username,
                status: business.status,
                whitelisted: common(yesOrNoText(business.whitelisted)),
                actions: (
                  <Button
                    className="ml-2"
                    onClick={() => handleDeleteClick(business)}
                    small
                    variant="danger"
                  >
                    {common("delete")}
                  </Button>
                ),
              }))}
              columns={[
                { Header: common("name"), accessor: "name" },
                { Header: t("owner"), accessor: "owner" },
                { Header: t("user"), accessor: "user" },
                businessWhitelisted ? { Header: t("status"), accessor: "status" } : null,
                { Header: t("whitelisted"), accessor: "whitelisted" },
                { Header: common("actions"), accessor: "actions" },
              ]}
            />
          )}
        </TabsContent>
        <PendingBusinessesTab setBusinesses={setBusinesses} businesses={pendingBusinesses} />
      </TabList>

      <Modal
        title={t("deleteBusiness")}
        onClose={() => closeModal(ModalIds.AlertDeleteBusiness)}
        isOpen={isOpen(ModalIds.AlertDeleteBusiness)}
        className="max-w-2xl"
      >
        <div>
          <p className="my-3">
            {t.rich("alert_deleteBusiness", {
              name: tempValue?.name ?? "",
              span: (children) => {
                return <span className="font-semibold">{children}</span>;
              },
            })}
          </p>
          <FormField label="Reason">
            <Input ref={reasonRef} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-2 mt-2">
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
            {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}{" "}
            {common("delete")}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data] = await requestAll(req, [["/admin/manage/businesses", []]]);

  return {
    props: {
      businesses: data,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
