import * as React from "react";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Infofield, TextField } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { requestAll, yesOrNoText } from "lib/utils";
import { Title } from "components/shared/Title";
import { useValues } from "context/ValuesContext";
import {
  getPenalCodeMaxFines,
  getPenalCodeMinFines,
} from "components/leo/modals/manage-record/table-item-form";
import { Editor, dataToSlate } from "components/editor/editor";

export default function Taxi() {
  const t = useTranslations("LawBook");
  const common = useTranslations("Common");
  const { penalCode } = useValues();
  const [search, setSearch] = React.useState("");

  const filteredPenalCodes = React.useMemo(() => {
    if (!search) {
      return penalCode.values;
    }

    return penalCode.values.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()));
  }, [search, penalCode.values]);

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between mb-5">
        <Title>{t("lawBook")}</Title>
      </header>

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
            {filteredPenalCodes.map((penalCode) => {
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
                      <Infofield label={t("isPrimary")}>
                        {yesOrNoText(penalCode.isPrimary)}
                      </Infofield>
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

                  <Editor hideBorder isReadonly value={description} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [values] = await requestAll(req, [["/admin/values/penal_code", []]]);

  return {
    props: {
      values,
      session: user,
      messages: {
        ...(await getTranslations(["citizen"], user?.locale ?? locale)),
      },
    },
  };
};
