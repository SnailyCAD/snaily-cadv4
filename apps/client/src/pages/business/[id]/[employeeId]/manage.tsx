import * as React from "react";
import type { GetServerSideProps } from "next";

import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";

import { FullBusiness, FullEmployee, useBusinessState } from "state/business-state";
import { useTranslations } from "use-intl";
import { TabList } from "components/shared/TabList";
import { EmployeeAsEnum } from "@snailycad/types";
import dynamic from "next/dynamic";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { EmployeesTab } from "components/business/manage/EmployeesTab";
import { BreadcrumbItem, Breadcrumbs } from "@snailycad/ui";
import { shallow } from "zustand/shallow";

interface Props {
  employee: FullEmployee | null;
  business: FullBusiness | null;
}

const ManageBusinessTab = dynamic(
  async () => (await import("components/business/manage/BusinessTab")).ManageBusinessTab,
);

const PendingEmployeesTab = dynamic(
  async () => (await import("components/business/manage/PendingEmployeesTab")).PendingEmployeesTab,
);

const VehiclesTab = dynamic(
  async () => (await import("components/business/manage/VehiclesTab")).VehiclesTab,
);

export default function BusinessId(props: Props) {
  const businessActions = useBusinessState((state) => ({
    setCurrentBusiness: state.setCurrentBusiness,
    setCurrentEmployee: state.setCurrentEmployee,
  }));

  const { currentBusiness, currentEmployee } = useBusinessState(
    (state) => ({
      currentBusiness: state.currentBusiness,
      currentEmployee: state.currentEmployee,
      posts: state.posts,
    }),
    shallow,
  );

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

  if (!currentEmployee.role || currentEmployee.role?.as === "EMPLOYEE") {
    return (
      <Layout className="dark:text-white">
        <p>{common("insufficientPermissions")}</p>
      </Layout>
    );
  }

  const tabsObj = [
    { enabled: true, name: t("allEmployees"), value: "allEmployees" },
    { enabled: true, name: t("businessVehicles"), value: "businessVehicles" },
    {
      enabled: currentEmployee.role.as === EmployeeAsEnum.OWNER,
      name: t("business"),
      value: "business",
    },
    {
      enabled: currentBusiness.whitelisted,
      name: t("pendingEmployees"),
      value: "pendingEmployees",
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
        <BreadcrumbItem href={`/citizen/${currentBusiness.id}`}>
          {currentBusiness.name}
        </BreadcrumbItem>
        <BreadcrumbItem>{common("manage")}</BreadcrumbItem>
      </Breadcrumbs>

      <div className="mt-3">
        <TabList tabs={tabs}>
          <EmployeesTab />
          <VehiclesTab />
          <ManageBusinessTab />
          {currentBusiness.whitelisted ? <PendingEmployeesTab /> : null}
        </TabList>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const user = await getSessionUser(req);
  const [business, values] = await requestAll(req, [
    [`/businesses/business/${query.id}?employeeId=${query.employeeId}`, null],
    ["/admin/values/business_role?paths=license", []],
  ]);

  const notFound = !business?.employee || business.employee.citizenId !== business.citizenId;

  return {
    notFound,
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
