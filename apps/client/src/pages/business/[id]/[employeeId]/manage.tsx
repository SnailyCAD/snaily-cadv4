import * as React from "react";
import type { GetServerSideProps } from "next";

import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";

import { type FullBusiness, type FullEmployee, useBusinessState } from "state/business-state";
import { useTranslations } from "use-intl";
import { EmployeeAsEnum } from "@snailycad/types";
import dynamic from "next/dynamic";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { EmployeesTab } from "components/business/manage/tabs/employees-tab/employees-tab";
import { TabList, BreadcrumbItem, Breadcrumbs } from "@snailycad/ui";
import type { GetBusinessByIdData } from "@snailycad/types/api";

interface Props {
  employee: FullEmployee | null;
  business: FullBusiness | null;
}

const ManageBusinessTab = dynamic(
  async () => (await import("components/business/manage/tabs/business-tab")).ManageBusinessTab,
);

const PendingEmployeesTab = dynamic(
  async () =>
    (await import("components/business/manage/tabs/pending-employees-tab")).PendingEmployeesTab,
);

const VehiclesTab = dynamic(
  async () => (await import("components/business/manage/tabs/vehicles-tab")).VehiclesTab,
);

const BusinessRolesTab = dynamic(
  async () =>
    (await import("components/business/manage/tabs/roles-tab/business-roles-tab")).BusinessRolesTab,
);

export default function BusinessId(props: Props) {
  const businessActions = useBusinessState((state) => ({
    setCurrentBusiness: state.setCurrentBusiness,
    setCurrentEmployee: state.setCurrentEmployee,
  }));

  const { currentBusiness, currentEmployee } = useBusinessState((state) => ({
    currentBusiness: state.currentBusiness,
    currentEmployee: state.currentEmployee,
    posts: state.posts,
  }));

  const common = useTranslations("Common");
  const t = useTranslations("Business");

  React.useEffect(() => {
    businessActions.setCurrentBusiness(props.business);
    businessActions.setCurrentEmployee(props.employee);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  if (!currentBusiness || !currentEmployee) {
    return null;
  }

  const isBusinessOwner = currentEmployee.role?.as === EmployeeAsEnum.OWNER;
  const hasManagePermissions =
    isBusinessOwner || currentEmployee.canManageEmployees || currentEmployee.canManageVehicles;

  if (!hasManagePermissions) {
    return (
      <Layout className="dark:text-white">
        <p>{common("insufficientPermissions")}</p>
      </Layout>
    );
  }

  const tabsObj = [
    {
      enabled: currentEmployee.canManageEmployees || isBusinessOwner,
      name: t("allEmployees"),
      value: "allEmployees",
    },
    {
      enabled: currentEmployee.canManageVehicles || isBusinessOwner,
      name: t("businessVehicles"),
      value: "businessVehicles",
    },
    {
      enabled: isBusinessOwner,
      name: t("business"),
      value: "business",
    },
    {
      enabled:
        currentBusiness.whitelisted && (currentEmployee.canManageEmployees || isBusinessOwner),
      name: t("pendingEmployees"),
      value: "pendingEmployees",
    },
    {
      enabled: isBusinessOwner,
      name: t("businessRoles"),
      value: "businessRoles",
    },
  ];

  const tabs = tabsObj.filter((v) => v.enabled);

  return (
    <Layout className="dark:text-white">
      <Title renderLayoutTitle={false} className="!mb-0">
        {common("manage")}
      </Title>

      <Breadcrumbs>
        <BreadcrumbItem href="/business">{t("business")}</BreadcrumbItem>
        <BreadcrumbItem href={`/business/${currentBusiness.id}/${currentEmployee.id}`}>
          {currentBusiness.name}
        </BreadcrumbItem>
        <BreadcrumbItem>{common("manage")}</BreadcrumbItem>
      </Breadcrumbs>

      <div className="mt-3">
        <TabList tabs={tabs}>
          <EmployeesTab />
          <VehiclesTab />
          {isBusinessOwner ? <ManageBusinessTab /> : null}
          {currentBusiness.whitelisted ? <PendingEmployeesTab /> : null}
          {isBusinessOwner ? <BusinessRolesTab /> : null}
        </TabList>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const user = await getSessionUser(req);
  const [business, values] = (await requestAll(req, [
    [`/businesses/business/${query.id}?employeeId=${query.employeeId}`, null],
    ["/admin/values/business_role?paths=license", []],
  ])) as [GetBusinessByIdData | null, any[]];

  const isCurrentEmployeeOwner = business?.employees.some((v) => {
    const hasManagePermissions =
      v.role?.as === "OWNER" || v.canManageEmployees || v.canManageVehicles;

    return hasManagePermissions && v.citizenId === business.employee?.citizenId;
  });

  return {
    notFound: !isCurrentEmployeeOwner,
    props: {
      business,
      values,
      employee: business?.employee ?? null,
      session: user,
      messages: {
        ...(await getTranslations(["business", "citizen", "common"], user?.locale ?? locale)),
      },
    },
  };
};
