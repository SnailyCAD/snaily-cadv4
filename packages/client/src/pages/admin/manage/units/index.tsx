import * as React from "react";
import Link from "next/link";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { FullDeputy, FullOfficer } from "state/dispatchState";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";

type Unit = (FullOfficer & { type: "OFFICER" }) | (FullDeputy & { type: "DEPUTY" });

interface Props {
  units: Unit[];
}

export default function SupervisorPanelPage({ units }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");
  const generateCallsign = useGenerateCallsign();

  const LABELS = {
    DEPUTY: t("Ems.deputy"),
    OFFICER: t("Leo.officer"),
  };

  return (
    <AdminLayout>
      <div className="overflow-x-auto w-full mt-3">
        <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
          <thead>
            <tr>
              <th>
                {t("Ems.deputy")}/{t("Leo.officer")}
              </th>
              <th>{common("name")}</th>
              <th>{t("Leo.callsign")}</th>
              <th>{t("Leo.badgeNumber")}</th>
              <th>{t("Leo.department")}</th>
              <th>{t("Leo.division")}</th>
              <th>{t("Leo.rank")}</th>
              <th>{t("Leo.status")}</th>
              <th>{common("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <td>{LABELS[unit.type]}</td>
                <td className="capitalize">{makeUnitName(unit)}</td>
                <td> {generateCallsign(unit)}</td>
                <td>{String(unit.badgeNumber)}</td>
                <td>{unit.department?.value?.value}</td>
                <td>{unit.division?.value?.value}</td>
                <td>{unit.rank?.value ?? common("none")}</td>
                <td>{unit.status?.value?.value ?? common("none")}</td>
                <td className="w-36">
                  <Link href={`/admin/manage/units/${unit.id}`}>
                    <a>
                      <Button small variant="success">
                        {common("manage")}
                      </Button>
                    </a>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [units] = await requestAll(req, [["/admin/manage/units", []]]);

  return {
    props: {
      units,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["admin", "leo", "ems-fd", "values", "common"], locale)),
      },
    },
  };
};
