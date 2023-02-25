import { useTranslations } from "use-intl";
import * as React from "react";
import {
  TabsContent,
  TabList,
  Loader,
  Button,
  TextField,
  buttonVariants,
  buttonSizes,
} from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import { WhitelistStatus, Rank } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { ModalIds } from "types/ModalIds";
import { requestAll, yesOrNoText } from "lib/utils";
import { PendingBusinessesTab } from "components/admin/manage/business/PendingBusinessesTab";
import { useAuth } from "context/AuthContext";
import { Table, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { Status } from "components/shared/Status";
import { usePermission, Permissions } from "hooks/usePermission";
import type { DeleteBusinessByIdData, GetManageBusinessesData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import Link from "next/link";
import { classNames } from "lib/classNames";

interface Props {
  businesses: GetManageBusinessesData;
}

export default function ManageBusinesses({ businesses: data }: Props) {
  const [businesses, setBusinesses] = React.useState<GetManageBusinessesData>(data);
  const [tempValue, valueState] = useTemporaryItem(businesses);
  const [reason, setReason] = React.useState("");
  const reasonRef = React.useRef<HTMLInputElement>(null);
  const { cad } = useAuth();

  const { state, execute } = useFetch();
  const { isOpen, openModal, closeModal } = useModal();
  const { hasPermissions } = usePermission();
  const tableState = useTableState();

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const businessWhitelisted = cad?.businessWhitelisted ?? false;
  const pendingBusinesses = businesses.filter((v) => v.status === WhitelistStatus.PENDING);

  const TABS = [
    {
      name: t("allBusinesses"),
      value: "allBusinesses",
    },
  ];

  if (hasPermissions([Permissions.ManageBusinesses], true) && businessWhitelisted) {
    TABS[1] = {
      name: `${t("pendingBusinesses")} (${pendingBusinesses.length})`,
      value: "pendingBusinesses",
    };
  }

  function handleDeleteClick(value: GetManageBusinessesData[number]) {
    valueState.setTempId(value.id);
    openModal(ModalIds.AlertDeleteBusiness);
  }

  async function handleDelete() {
    if (!tempValue) return;

    if (!reason.trim() && reasonRef.current) {
      return reasonRef.current.focus();
    }

    const { json } = await execute<DeleteBusinessByIdData>({
      path: `/admin/manage/businesses/${tempValue.id}`,
      method: "DELETE",
      data: { reason },
    });

    if (json) {
      setBusinesses((p) => p.filter((v) => v.id !== tempValue.id));
      valueState.setTempId(null);
      closeModal(ModalIds.AlertDeleteBusiness);
    }
  }

  React.useEffect(() => {
    setBusinesses(data);
  }, [data]);

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [
          Permissions.ViewBusinesses,
          Permissions.DeleteBusinesses,
          Permissions.ManageBusinesses,
        ],
      }}
    >
      <Title>{t("MANAGE_BUSINESSES")}</Title>

      <TabList tabs={TABS}>
        <TabsContent aria-label={t("allBusinesses")} value="allBusinesses">
          <h2 className="text-2xl font-semibold mb-2">{t("allBusinesses")}</h2>

          {businesses.length <= 0 ? (
            <p className="mt-5">{t("noBusinesses")}</p>
          ) : (
            <Table
              tableState={tableState}
              data={businesses.map((business) => ({
                id: business.id,
                name: business.name,
                owner: `${business.citizen.name} ${business.citizen.surname}`,
                user: business.user.username,
                status: <Status fallback="—">{business.status}</Status>,
                whitelisted: common(yesOrNoText(business.whitelisted)),
                actions: (
                  <>
                    <Button
                      className="ml-2"
                      onPress={() => handleDeleteClick(business)}
                      size="xs"
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>

                    <Link
                      className={classNames(
                        buttonVariants.default,
                        buttonSizes.xs,
                        "border rounded-md ml-2",
                      )}
                      href={`/admin/manage/businesses/${business.id}`}
                    >
                      {common("manage")}
                    </Link>
                  </>
                ),
              }))}
              columns={[
                { header: common("name"), accessorKey: "name" },
                { header: t("owner"), accessorKey: "owner" },
                { header: t("user"), accessorKey: "user" },
                businessWhitelisted ? { header: t("status"), accessorKey: "status" } : null,
                { header: t("whitelisted"), accessorKey: "whitelisted" },
                hasPermissions([Permissions.DeleteBusinesses], true)
                  ? { header: common("actions"), accessorKey: "actions" }
                  : null,
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
            })}
          </p>
          <TextField label="Reason" inputRef={reasonRef} value={reason} onChange={setReason} />
        </div>

        <div className="flex items-center justify-end gap-2 mt-2">
          <Button
            variant="cancel"
            disabled={state === "loading"}
            onPress={() => closeModal(ModalIds.AlertDeleteBusiness)}
          >
            {common("cancel")}
          </Button>
          <Button
            disabled={state === "loading"}
            className="flex items-center"
            variant="danger"
            onPress={handleDelete}
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
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/admin/manage/businesses", []]]);

  return {
    props: {
      businesses: data,
      session: user,
      messages: {
        ...(await getTranslations(
          ["citizen", "admin", "values", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
