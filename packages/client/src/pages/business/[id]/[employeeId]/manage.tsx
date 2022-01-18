import * as React from "react";
import { GetServerSideProps } from "next";

import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";

import { FullBusiness, FullEmployee, useBusinessState } from "state/businessState";
import { useTranslations } from "use-intl";
import { TabList } from "components/shared/TabList";
import { EmployeeAsEnum } from "types/prisma";
import dynamic from "next/dynamic";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { EmployeesTab } from "components/business/manage/EmployeesTab";

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
  const { currentBusiness, currentEmployee, ...state } = useBusinessState();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  React.useEffect(() => {
    state.setCurrentBusiness(props.business);
    state.setCurrentEmployee(props.employee);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, state.setCurrentEmployee, state.setCurrentBusiness]);

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

  const tabsObj = {
    [t("allEmployees")]: true,
    [t("businessVehicles")]: true,
    [t("business")]: currentEmployee.role.as === EmployeeAsEnum.OWNER,
    [t("pendingEmployees")]: currentBusiness.whitelisted,
  };

  const tabs = Object.entries(tabsObj)
    .map(([k, v]) => (v === true ? k : undefined))
    .filter(Boolean) as string[];

  return (
    <Layout className="dark:text-white">
      <Title>
        {currentBusiness.name} - {common("manage")}
      </Title>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">
          {currentBusiness.name} - {common("manage")}
        </h1>
      </header>

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
  const [business, values] = await requestAll(req, [
    [`/businesses/business/${query.id}?employeeId=${query.employeeId}`, null],
    ["/admin/values/business_role?paths=vehicle,license", []],
  ]);

  const notFound =
    !business || !business?.employee || business.employee.citizenId !== business.citizenId;

  return {
    notFound,
    props: {
      business,
      values,
      employee: business?.employee ?? null,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["business", "citizen", "common"], locale)),
      },
    },
  };
};
