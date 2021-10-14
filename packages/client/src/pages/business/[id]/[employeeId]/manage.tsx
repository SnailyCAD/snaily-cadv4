import * as React from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";

import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";

import { FullBusiness, FullEmployee, useBusinessState } from "state/businessState";
import { useTranslations } from "use-intl";
import { TabsContainer } from "components/tabs/TabsContainer";
import { EmployeesTab } from "components/business/manage/EmployeesTab";
import { ManageBusinessTab } from "components/business/manage/BusinessTab";

interface Props {
  employee: FullEmployee | null;
  business: FullBusiness | null;
}

export default function BusinessId(props: Props) {
  const { currentBusiness, currentEmployee, ...state } = useBusinessState();
  const common = useTranslations("Common");

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

  return (
    <Layout>
      <Head>
        <title>
          {" "}
          {currentBusiness.name} - {common("manage")}
        </title>
      </Head>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">
          {currentBusiness.name} - {common("manage")}
        </h1>
      </header>

      <div className="mt-3">
        <TabsContainer tabs={["Employees", "Business"]}>
          <EmployeesTab />

          <ManageBusinessTab />
        </TabsContainer>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const { data: business } = await handleRequest(
    `/businesses/business/${query.id}?employeeId=${query.employeeId}`,
    {
      headers: req.headers,
    },
  ).catch((e) => ({ data: e }));

  const { data: values } = await handleRequest("/admin/values/business-role", {
    headers: req.headers,
  }).catch(() => ({ data: [] }));

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
