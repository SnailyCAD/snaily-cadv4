import * as React from "react";
import { Layout } from "components/Layout";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { Editor } from "components/modal/DescriptionModal/Editor";
import { useTranslations } from "next-intl";
import type { GetServerSideProps } from "next";
import { requestAll } from "lib/utils";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useValues } from "context/ValuesContext";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";

export default function PenalCodesPage() {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { penalCode } = useValues();

  const [search, setSearch] = React.useState("");
  const [filtered, setFiltered] = React.useState(penalCode.values);

  React.useEffect(() => {
    if (!search) {
      setFiltered(penalCode.values);
    }

    setFiltered(
      penalCode.values.filter((v) => v.title.toLowerCase().includes(search.toLowerCase())),
    );
  }, [search, penalCode.values]);

  return (
    <Layout
      permissions={{ fallback: (u) => u.isLeo, permissions: [Permissions.Leo] }}
      className="dark:text-white"
    >
      <Title>{t("penalCodes")}</Title>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("penalCodes")}</h1>
      </header>

      {penalCode.values.length <= 0 ? (
        <p className="mt-5">{t("noPenalCodes")}</p>
      ) : (
        <>
          <FormField label={common("search")} className="my-2">
            <Input onChange={(e) => setSearch(e.target.value)} value={search} />
          </FormField>

          <ul className="flex flex-col mt-5">
            {filtered.map((penalCode) => (
              <li className="card p-4" key={penalCode.id}>
                <h3 className="text-2xl font-semibold">{penalCode.title}</h3>

                <Editor isReadonly value={penalCode.descriptionData!} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [values] = await requestAll(req, [["/admin/values/penal_code", []]]);

  return {
    props: {
      session: await getSessionUser(req),
      values,
      messages: {
        ...(await getTranslations(["leo", "common"], locale)),
      },
    },
  };
};
