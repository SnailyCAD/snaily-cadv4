import { useRouter } from "next/router";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import useFetch from "lib/useFetch";
import { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useCitizen } from "context/CitizenContext";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";

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

    const { json } = await execute(`/citizen/${citizen.id}`, {
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

    if (json?.id) {
      router.push(`/citizen/${json.id}`);
    }
  }

  return (
    <Layout className="dark:text-white">
      <Title>
        {t("editCitizen")} - {citizen.name} {citizen.surname}
      </Title>

      <h1 className="mb-3 text-3xl font-semibold">{t("editCitizen")}</h1>

      <ManageCitizenForm citizen={citizen} onSubmit={onSubmit} state={state} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
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
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "common"], locale)),
      },
    },
  };
};
