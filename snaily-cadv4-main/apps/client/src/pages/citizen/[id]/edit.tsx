import { useRouter } from "next/router";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import useFetch from "lib/useFetch";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useCitizen } from "context/CitizenContext";
import { requestAll } from "lib/utils";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";
import type { PostCitizenImageByIdData, PutCitizenByIdData } from "@snailycad/types/api";
import { BreadcrumbItem, Breadcrumbs } from "@snailycad/ui";

export default function EditCitizen() {
  const { state, execute } = useFetch();
  const router = useRouter();
  const t = useTranslations("Citizen");

  const { citizen } = useCitizen();

  if (!citizen) {
    return null;
  }

  async function onSubmit({
    formData,
    data,
    helpers,
  }: {
    formData?: FormData;
    data: any;
    helpers: any;
  }) {
    if (!citizen) return;

    const { json, error } = await execute<PutCitizenByIdData>({
      path: `/citizen/${citizen.id}`,
      method: "PUT",
      data,
      helpers,
    });

    const errors = ["dateLargerThanNow", "nameAlreadyTaken", "invalidImageType"];
    if (errors.includes(error as string)) {
      helpers.setCurrentStep(0);
    }

    if (formData) {
      await execute<PostCitizenImageByIdData>({
        path: `/citizen/${citizen.id}`,
        method: "POST",
        data: formData,
        helpers,
        headers: {
          "content-type": "multipart/form-data",
        },
      });
    }

    if (json?.id) {
      router.push(`/citizen/${json.id}`);
    }
  }

  return (
    <Layout className="dark:text-white">
      <Breadcrumbs>
        <BreadcrumbItem href="/citizen">{t("citizen")}</BreadcrumbItem>
        <BreadcrumbItem href={`/citizen/${citizen.id}`}>
          {citizen.name} {citizen.surname}
        </BreadcrumbItem>
        <BreadcrumbItem>{t("editCitizen")}</BreadcrumbItem>
      </Breadcrumbs>

      <ManageCitizenForm citizen={citizen} onSubmit={onSubmit} state={state} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const user = await getSessionUser(req);
  const [data, values] = await requestAll(req, [
    [`/citizen/${query.id}`, null],
    ["/admin/values/gender?paths=ethnicity", []],
  ]);

  if (!data) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      values,
      citizen: data,
      session: user,
      messages: {
        ...(await getTranslations(["citizen", "common"], user?.locale ?? locale)),
      },
    },
  };
};
