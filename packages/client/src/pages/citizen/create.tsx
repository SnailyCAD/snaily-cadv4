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
    const { json } = await execute("/citizen", {
      method: "POST",
      helpers,
      data: {
        ...data,
        driversLicenseCategory: data.driversLicenseCategory?.map((v: any) => v.value?.id) ?? null,
        pilotLicenseCategory: data.pilotLicenseCategory?.map((v: any) => v.value?.id) ?? null,
        waterLicenseCategory: data.waterLicenseCategory?.map((v: any) => v.value?.id) ?? null,
        firearmLicenseCategory: data.firearmLicenseCategory?.map((v: any) => v.value?.id) ?? null,
      },
    });

    if (json?.id) {
      if (formData) {
        await execute(`/citizen/${json.id}`, {
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
      <Title>{t("createCitizen")}</Title>

      <ManageCitizenForm onSubmit={onSubmit} citizen={null} state={state} showLicenseFields />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [values] = await requestAll(req, [
    ["/admin/values/gender?paths=ethnicity,license,driverslicense_category", []],
  ]);

  return {
    props: {
      values,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "common"], locale)),
      },
    },
  };
};
