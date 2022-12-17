import * as React from "react";
import { Layout } from "components/Layout";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { dataToSlate, Editor } from "components/editor/editor";
import { useTranslations } from "next-intl";
import type { GetServerSideProps } from "next";
import { requestAll, yesOrNoText } from "lib/utils";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useValues } from "context/ValuesContext";
import { TextField } from "@snailycad/ui";
import { Infofield } from "components/shared/Infofield";
import {
  getPenalCodeMaxFines,
  getPenalCodeMinFines,
} from "components/leo/modals/manage-record/table-item-form";

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

      {penalCode.values.length <= 0 ? (
        <p className="mt-5">{t("noPenalCodes")}</p>
      ) : (
        <>
          <TextField
            label={common("search")}
            className="my-2"
            name="search"
            value={search}
            onChange={(value) => setSearch(value)}
          />

          <ul className="flex flex-col mt-3 gap-y-2">
            {filtered.map((penalCode) => {
              const description = dataToSlate(penalCode);
              const maxFine = getPenalCodeMaxFines(penalCode);
              const minFine = getPenalCodeMinFines(penalCode);
              const [minJailTime, maxJailTime] = penalCode.warningNotApplicable?.prisonTerm ?? [];
              const [minBail, maxBail] = penalCode.warningNotApplicable?.bail ?? [];

              return (
                <li className="card p-4" key={penalCode.id}>
                  <header>
                    <h3 className="text-2xl font-semibold">{penalCode.title}</h3>

                    <div className="mt-2">
                      <Infofield label={common("type")}>
                        {penalCode.type?.toLowerCase() ?? common("none")}
                      </Infofield>
                      <Infofield label="Is Primary">{yesOrNoText(penalCode.isPrimary)}</Infofield>
                      <Infofield label={t("warningApplicable")}>
                        {String(Boolean(penalCode.warningApplicable))}
                      </Infofield>
                      <Infofield label={t("fines")}>
                        {minFine}-{maxFine}
                      </Infofield>
                      {typeof minJailTime !== "undefined" ? (
                        <Infofield label={t("jailTime")}>
                          {minJailTime}-{maxJailTime}
                        </Infofield>
                      ) : null}
                      {typeof minBail !== "undefined" ? (
                        <Infofield label={t("bail")}>
                          {minBail}-{maxBail}
                        </Infofield>
                      ) : null}
                    </div>
                  </header>

                  <Editor isReadonly value={description} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [values] = await requestAll(req, [["/admin/values/penal_code", []]]);

  return {
    props: {
      session: user,
      values,
      messages: {
        ...(await getTranslations(["leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
