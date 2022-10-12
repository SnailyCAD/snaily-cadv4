import * as React from "react";
import { useRouter } from "next/router";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import useFetch from "lib/useFetch";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";
import type { SelectValue } from "components/form/Select";
import type { PostCitizenImageByIdData, PostCitizensData } from "@snailycad/types/api";
import { BreadcrumbItem, Breadcrumbs } from "@snailycad/ui";

export default function CreateCitizen() {
  const { state, execute } = useFetch();
  const router = useRouter();
  const t = useTranslations("Citizen");

  async function onSubmit({
    formData,
    data,
    helpers,
  }: {
    formData?: FormData;
    data: any;
    helpers: any;
  }) {
    const { json } = await execute<PostCitizensData>({
      path: "/citizen",
      method: "POST",
      helpers,
      data: {
        ...data,
        driversLicenseCategory: Array.isArray(data.driversLicenseCategory)
          ? (data.driversLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.driversLicenseCategory,
        pilotLicenseCategory: Array.isArray(data.pilotLicenseCategory)
          ? (data.pilotLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.pilotLicenseCategory,
        waterLicenseCategory: Array.isArray(data.waterLicenseCategory)
          ? (data.waterLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.waterLicenseCategory,
        firearmLicenseCategory: Array.isArray(data.firearmLicenseCategory)
          ? (data.firearmLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.firearmLicenseCategory,
      },
    });

    if (json?.id) {
      if (formData) {
        await execute<PostCitizenImageByIdData>({
          path: `/citizen/${json.id}`,
          method: "POST",
          data: formData,
          helpers,
        });
      }

      const path = `/citizen/${json.id}`;
      router.push(path);
    }
  }

  return (
    <Layout className="dark:text-white">
      <Breadcrumbs>
        <BreadcrumbItem href="/citizen">{t("citizen")}</BreadcrumbItem>
        <BreadcrumbItem>{t("createCitizen")}</BreadcrumbItem>
      </Breadcrumbs>

      <Title>{t("createCitizen")}</Title>

      <ManageCitizenForm onSubmit={onSubmit} citizen={null} state={state} showLicenseFields />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [values] = await requestAll(req, [
    ["/admin/values/gender?paths=ethnicity,license,driverslicense_category", []],
  ]);

  return {
    props: {
      values,
      session: user,
      messages: {
        ...(await getTranslations(["citizen", "common"], user?.locale ?? locale)),
      },
    },
  };
};
