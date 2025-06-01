import { useTranslations } from "use-intl";
import { Alert, Button, Status, buttonVariants } from "@snailycad/ui";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import { EmployeeAsEnum, ValueType, WhitelistStatus } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll, yesOrNoText } from "lib/utils";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { usePermission, Permissions } from "hooks/usePermission";
import type {
  DeleteBusinessFireEmployeeData,
  GetManageBusinessByIdEmployeesData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { ModalIds } from "types/modal-ids";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "react-bootstrap-icons";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal, {
  ssr: false,
});

const ManageEmployeeModal = dynamic(
  async () =>
    (await import("components/business/manage/tabs/employees-tab/manage-employee-modal"))
      .ManageEmployeeModal,
  { ssr: false },
);

interface Props {
  business: GetManageBusinessByIdEmployeesData;
  businessId: string;
}

export default function ManageBusinesses({ business, businessId }: Props) {
  const { state, execute } = useFetch();
  const modalState = useModal();
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([
    Permissions.ManageBusinesses,
    Permissions.DeleteBusinesses,
  ]);

  useLoadValuesClientSide({
    valueTypes: [ValueType.BUSINESS_ROLE],
  });

  const asyncTable = useAsyncTable({
    fetchOptions: {
      path: `/admin/manage/businesses/${businessId}/employees`,
      onResponse: (data: GetManageBusinessByIdEmployeesData) => ({
        data: data.employees,
        totalCount: data.totalCount,
      }),
    },
    totalCount: business.totalCount,
    initialData: business.employees,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const [tempEmployee, employeeState] = useTemporaryItem(asyncTable.items);

  const t = useTranslations();
  const common = useTranslations("Common");
  const isBusinessPendingApproval = business.status === WhitelistStatus.PENDING;

  async function handleFireEmployee() {
    if (!hasManagePermissions || !tempEmployee) return;

    const { json } = await execute<DeleteBusinessFireEmployeeData>({
      path: `/admin/manage/businesses/employees/${tempEmployee.id}`,
      data: { employeeId: tempEmployee.id },
      method: "DELETE",
    });

    if (json) {
      asyncTable.remove(tempEmployee.id);
      employeeState.setTempId(null);
      modalState.closeModal(ModalIds.AlertFireEmployee);
    }
  }

  return (
    <AdminLayout
      permissions={{
        permissions: [
          Permissions.ViewBusinesses,
          Permissions.DeleteBusinesses,
          Permissions.ManageBusinesses,
        ],
      }}
    >
      <header className="flex items-center justify-between mt-5">
        <Title>{t("Business.employees")}</Title>

        <Link
          className={buttonVariants({ className: "flex items-center gap-2" })}
          href="/admin/manage/businesses"
        >
          <ArrowLeft /> {t("Common.goBack")}
        </Link>
      </header>

      {isBusinessPendingApproval ? (
        <Alert type="warning" title="Business is pending approval">
          <p>
            This business is still pending approval. It must first be approved by an administrator
            before any changes can be done.{" "}
            <Link
              className="font-medium underline"
              href="/admin/manage/businesses?activeTab=pendingBusinesses"
            >
              Go back
            </Link>
          </p>
        </Alert>
      ) : null}

      <Table
        tableState={tableState}
        data={asyncTable.items.map((employee) => ({
          id: employee.id,
          name: `${employee.citizen.name} ${employee.citizen.surname}`,
          role: employee.role?.value.value ?? common("none"),
          canCreatePosts: common(yesOrNoText(employee.canCreatePosts)),
          employeeOfTheMonth: common(yesOrNoText(employee.employeeOfTheMonth)),
          whitelistStatus: <Status>{employee.whitelistStatus}</Status>,
          actions: (
            <>
              <Button
                onPress={() => {
                  employeeState.setTempId(employee.id);
                  modalState.openModal(ModalIds.ManageEmployee);
                }}
                size="xs"
                variant="success"
                disabled={isBusinessPendingApproval}
              >
                {common("manage")}
              </Button>
              <Button
                onPress={() => {
                  employeeState.setTempId(employee.id);
                  modalState.openModal(ModalIds.AlertFireEmployee);
                }}
                size="xs"
                disabled={isBusinessPendingApproval || employee.role?.as === EmployeeAsEnum.OWNER}
                className="ml-2"
                variant="danger"
              >
                {t("Business.fire")}
              </Button>
            </>
          ),
        }))}
        columns={[
          { header: common("name"), accessorKey: "name" },
          { header: t("Business.role"), accessorKey: "role" },
          { header: t("Business.canCreatePosts"), accessorKey: "canCreatePosts" },
          { header: t("Business.employeeOfTheMonth"), accessorKey: "employeeOfTheMonth" },
          { header: t("Business.whitelistStatus"), accessorKey: "whitelistStatus" },
          { header: common("actions"), accessorKey: "actions" },
        ]}
      />

      {hasManagePermissions && !isBusinessPendingApproval ? (
        <>
          <AlertModal
            onDeleteClick={handleFireEmployee}
            id={ModalIds.AlertFireEmployee}
            title={t("Business.fireEmployee")}
            description={t.rich("Business.alert_fireEmployee", {
              employee:
                tempEmployee && `${tempEmployee.citizen.name} ${tempEmployee.citizen.surname}`,
            })}
            deleteText={t("Business.fire")}
            state={state}
            onClose={() => employeeState.setTempId(null)}
          />

          <ManageEmployeeModal
            isAdmin
            onUpdate={(_oldEmployee, employee) => asyncTable.update(employee.id, employee)}
            employee={tempEmployee}
          />
        </>
      ) : null}
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req, params }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [
    [`/admin/manage/businesses/${params?.id}/employees`, { totalCount: 0, employees: [] }],
  ]);

  if (!data) {
    return { notFound: true };
  }

  return {
    props: {
      business: data,
      businessId: params?.id,
      session: user,
      messages: {
        ...(await getTranslations(
          ["business", "admin", "values", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
