import * as React from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";

import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";

import { FullBusiness, FullEmployee, useBusinessState } from "state/businessState";
import { useTranslations } from "use-intl";
import { TabsContainer } from "components/tabs/TabsContainer";
import { EmployeeAsEnum } from "types/prisma";
import dynamic from "next/dynamic";
import { requestAll } from "lib/utils";

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

const EmployeesTab = dynamic(
  async () => (await import("components/business/manage/EmployeesTab")).EmployeesTab,
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
      <Layout>
        <p>{common("insufficientPermissions")}</p>
      </Layout>
    );
  }

  const tabsObj = {
    [t("allEmployees")]: true,
    [t("pendingEmployees")]: currentBusiness.whitelisted,
    [t("business")]: currentEmployee.role.as === EmployeeAsEnum.OWNER,
  };

  const tabs = Object.entries(tabsObj)
    .map(([k, v]) => (v === true ? k : undefined))
    .filter(Boolean) as string[];

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>
          {currentBusiness.name} - {common("manage")}
        </title>
      </Head>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">
          {currentBusiness.name} - {common("manage")}
        </h1>
      </header>

      <div className="mt-3">
        <TabsContainer tabs={tabs}>
          <EmployeesTab />
          {currentBusiness.whitelisted ? <PendingEmployeesTab /> : null}
          <ManageBusinessTab />
        </TabsContainer>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const [business, values] = await requestAll(req, [
    [`/businesses/business/${query.id}?employeeId=${query.employeeId}`, null],
    ["/admin/values/business-role", []],
  ]);

  const notFound =
    !business || !business?.employee || business.employee.citizenId !== business.citizenId;

  return {
    notFound,
    props: {
      business,
      values,
      employee: business?.employee ?? null,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["business", "common"], locale)),
      },
    },
  };
};
