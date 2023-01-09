import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import { WhitelistStatus, Rank, EmployeeAsEnum } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll, yesOrNoText } from "lib/utils";
import { useAuth } from "context/AuthContext";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { Status } from "components/shared/Status";
import { usePermission, Permissions } from "hooks/usePermission";
import type { GetManageBusinessByIdEmployeesData } from "@snailycad/types/api";
import { ManageEmployeeModal } from "components/business/manage/ManageEmployeeModal";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { ModalIds } from "types/ModalIds";

interface Props {
  business: GetManageBusinessByIdEmployeesData;
  businessId: string;
}

export default function ManageBusinesses({ business, businessId }: Props) {
  console.log({ business });

  const { cad } = useAuth();

  const { state, execute } = useFetch();
  const { isOpen, openModal, closeModal } = useModal();
  const { hasPermissions } = usePermission();
  const tableState = useTableState();

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

  const [tempEmployee, employeeState] = useTemporaryItem(asyncTable.items);
  const t = useTranslations();
  const common = useTranslations("Common");

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
      <Title className="mb-5">{t("Business.employees")}</Title>

      <Table
        tableState={tableState}
        data={asyncTable.items.map((employee) => ({
          id: employee.id,
          name: `${employee.citizen.name} ${employee.citizen.surname}`,
          role: employee.role?.value.value ?? common("none"),
          canCreatePosts: common(yesOrNoText(employee.canCreatePosts)),
          employeeOfTheMonth: common(yesOrNoText(employee.employeeOfTheMonth)),
          whitelistStatus: (
            <Status state={employee.whitelistStatus}>
              {employee.whitelistStatus.toLowerCase()}
            </Status>
          ),
          actions: (
            <>
              <Button
                onPress={() => {
                  employeeState.setTempId(employee.id);
                  openModal(ModalIds.ManageEmployee);
                }}
                size="xs"
                // disabled={
                //   employee.role?.as === EmployeeAsEnum.OWNER ||
                //   employee.whitelistStatus === WhitelistStatus.PENDING
                // }
                variant="success"
              >
                {common("manage")}
              </Button>
              <Button
                size="xs"
                // disabled={
                //   employee.role?.as === EmployeeAsEnum.OWNER ||
                //   employee.whitelistStatus === WhitelistStatus.PENDING
                // }
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

      {/* <AlertModal
        id={ModalIds.AlertFireEmployee}
        title={t("Management.fireEmployee")}
        description={t("Management.alert_fireEmployee", {
          employee: tempEmployee && `${tempEmployee.citizen.name} ${tempEmployee.citizen.surname}`,
        })}
        onDeleteClick={handleFireEmployee}
        deleteText={t("Management.fire")}
        state={state}
        onClose={() => employeeState.setTempId(null)}
      />
*/}

      <ManageEmployeeModal
        isAdmin
        // onUpdate={handleUpdate}
        employee={tempEmployee}
      />
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
