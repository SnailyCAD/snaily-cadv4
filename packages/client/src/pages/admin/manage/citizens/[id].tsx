import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type { Citizen, User } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";
import useFetch from "lib/useFetch";
import type { FormikHelpers } from "formik";
import { useRouter } from "next/router";

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
      data,
      helpers,
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
    <AdminLayout>
      <Title>
        {common("manage")} {citizen.name} {citizen.surname}
      </Title>

      <h1 className="text-3xl font-semibold">
        {common("manage")} {citizen.name} {citizen.surname}
      </h1>

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
