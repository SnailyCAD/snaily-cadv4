import { useTranslations } from "use-intl";
import { TabsContent, TabList, Loader, Button, buttonVariants, buttonSizes } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import { Rank } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { ModalIds } from "types/ModalIds";
import { requestAll, yesOrNoText } from "lib/utils";
import { PendingBusinessesTab } from "components/admin/manage/business/pending-businesses-tab";
import { useAuth } from "context/AuthContext";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
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
  const { cad } = useAuth();

  const { state, execute } = useFetch();
  const { isOpen, openModal, closeModal } = useModal();
  const { hasPermissions } = usePermission();
  const tableState = useTableState();

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const businessWhitelisted = cad?.businessWhitelisted ?? false;

  const asyncTable = useAsyncTable<GetManageBusinessesData["businesses"][number]>({
    totalCount: data.totalCount,
    initialData: data.businesses,
    fetchOptions: {
      path: "/admin/manage/businesses",
      onResponse: (json: GetManageBusinessesData) => ({
        data: json.businesses,
        totalCount: json.totalCount,
      }),
    },
  });
  const [tempValue, valueState] = useTemporaryItem(asyncTable.items);

  const TABS = [
    {
      name: t("allBusinesses"),
      value: "allBusinesses",
    },
  ];

  if (hasPermissions([Permissions.ManageBusinesses], true) && businessWhitelisted) {
    TABS[1] = {
      name: `${t("pendingBusinesses")}`,
      value: "pendingBusinesses",
    };
  }

  function handleDeleteClick(value: GetManageBusinessesData["businesses"][number]) {
    valueState.setTempId(value.id);
    openModal(ModalIds.AlertDeleteBusiness);
  }

  async function handleDelete() {
    if (!tempValue) return;

    const { json } = await execute<DeleteBusinessByIdData>({
      path: `/admin/manage/businesses/${tempValue.id}`,
      method: "DELETE",
    });

    if (json) {
      asyncTable.remove(tempValue.id);

      valueState.setTempId(null);
      closeModal(ModalIds.AlertDeleteBusiness);
    }
  }

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
        <TabsContent
          tabName={t("allBusinesses")}
          aria-label={t("allBusinesses")}
          value="allBusinesses"
        >
          <h2 className="text-2xl font-semibold mb-2">{t("allBusinesses")}</h2>

          {asyncTable.items.length <= 0 ? (
            <p className="mt-5">{t("noBusinesses")}</p>
          ) : (
            <Table
              tableState={tableState}
              data={asyncTable.items.map((business) => ({
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
        <PendingBusinessesTab />
      </TabList>

      <Modal
        title={t("deleteBusiness")}
        onClose={() => closeModal(ModalIds.AlertDeleteBusiness)}
        isOpen={isOpen(ModalIds.AlertDeleteBusiness)}
        className="max-w-2xl"
      >
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
