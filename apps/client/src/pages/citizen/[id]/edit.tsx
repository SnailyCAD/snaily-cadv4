import { useRouter } from "next/router";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import useFetch from "lib/useFetch";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useCitizen } from "context/CitizenContext";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";
import type { PostCitizenImageByIdData, PutCitizenByIdData } from "@snailycad/types/api";

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

    const { json } = await execute<PutCitizenByIdData>({
      path: `/citizen/${citizen.id}`,
      method: "PUT",
      data,
      helpers,
    });

    if (formData) {
      await execute<PostCitizenImageByIdData>({
        path: `/citizen/${citizen.id}`,
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
      <header className="mb-3">
        <Title className="mb-2">{t("editCitizen")}</Title>
        <h2 className="text-lg">
          {t.rich("editingCitizen", {
            span: (children) => <span className="font-semibold">{children}</span>,
            citizen: `${citizen.name} ${citizen.surname}`,
          })}
        </h2>
      </header>

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
