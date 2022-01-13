import * as React from "react";
import { useRouter } from "next/router";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import useFetch from "lib/useFetch";
import { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { SelectValue } from "components/form/Select";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";

export default function CreateCitizen() {
  const { state, execute } = useFetch();
  const router = useRouter();
  const t = useTranslations("Citizen");

  async function onSubmit({ formData, data }: { formData?: FormData; data: any }) {
    const { json } = await execute("/citizen", {
      method: "POST",
      data: {
        ...data,
        driversLicenseCategory: Array.isArray(data.driversLicenseCategory)
          ? (data.driversLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.driversLicenseCategory,
        pilotLicenseCategory: Array.isArray(data.pilotLicenseCategory)
          ? (data.pilotLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.pilotLicenseCategory,
      },
    });

    if (json?.id) {
      if (formData) {
        await execute(`/citizen/${json.id}`, {
          method: "POST",
          data: formData,
        });
      }

      const path = `/citizen/${json.id}`;
      router.push(path);
    }
  }

  return (
    <Layout className="dark:text-white">
      <Title>{t("createCitizen")}</Title>

      <h1 className="mb-3 text-3xl font-semibold">{t("createCitizen")}</h1>

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
