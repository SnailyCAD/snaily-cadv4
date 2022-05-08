import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Citizen, Rank, User } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";
import useFetch from "lib/useFetch";
import type { FormikHelpers } from "formik";
import { useRouter } from "next/router";
import { Permissions } from "@snailycad/permissions";
import type { SelectValue } from "components/form/Select";

interface Props {
  citizen: Citizen & { user: User };
}

export default function ManageCitizens({ citizen }: Props) {
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const router = useRouter();

  async function handleSubmit({
    data,
    helpers,
    formData,
  }: {
    data: any;
    formData?: FormData;
    helpers: FormikHelpers<any>;
  }) {
    const { json } = await execute(`/admin/manage/citizens/${citizen.id}`, {
      method: "PUT",
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

    if (formData) {
      await execute(`/citizen/${citizen.id}`, {
        method: "POST",
        data: formData,
        helpers,
      });
    }

    if (json.id) {
      router.push("/admin/manage/citizens");
    }
  }

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageCitizens],
      }}
    >
      <Title>
        {common("manage")} {citizen.name} {citizen.surname}
      </Title>

      <div className="mt-5">
        <ManageCitizenForm
          allowEditingName
          showLicenseFields
          citizen={citizen}
          onSubmit={handleSubmit}
          state={state}
          cancelURL="/admin/manage/citizens"
        />
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, query, req }) => {
  const [citizen, values] = await requestAll(req, [
    [`/admin/manage/citizens/${query.id}`, null],
    ["/admin/values/gender?paths=ethnicity,license", []],
  ]);

  if (!citizen) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      citizen,
      values,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
