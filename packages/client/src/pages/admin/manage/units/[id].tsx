import * as React from "react";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { FullDeputy, FullOfficer } from "state/dispatchState";
import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { FormField } from "components/form/FormField";
import { useValues } from "context/ValuesContext";
import { Select } from "components/form/Select";
import { Button } from "components/Button";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { OfficerLog } from "types/prisma";
import formatDistance from "date-fns/formatDistance";
import format from "date-fns/format";
import { Table } from "components/shared/Table";
import { Toggle } from "components/form/Toggle";
import { Title } from "components/shared/Title";

type Unit = (FullOfficer & { logs: OfficerLog[] }) | FullDeputy;

interface Props {
  unit: Unit | null;
}

export default function SupervisorPanelPage({ unit }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { codes10, department, division, officerRank } = useValues();
  const { state, execute } = useFetch();
  const router = useRouter();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!unit) return;

    const data = {
      ...values,
      divisions: values.divisions.map((v) => v.value),
    };

    const { json } = await execute(`/admin/manage/units/${unit.id}`, {
      method: "PUT",
      data,
    });

    if (json.id) {
      toast.success("Updated.");
      router.push("/admin/manage/units");
    }
  }

  if (!unit) {
    return null;
  }

  const divisions = ("divisions" in unit && unit.divisions) || [];
  const INITIAL_VALUES = {
    status: unit.statusId,
    department: unit.departmentId,
    division: unit.divisionId,
    divisions: divisions.map((v) => ({ value: v.id, label: v.value.value })) ?? [],
    callsign: unit.callsign,
    rank: unit.rankId,
    suspended: unit.suspended,
  };

  return (
    <AdminLayout className="dark:text-white">
      <Title>
        {common("manage")} {makeUnitName(unit)}
      </Title>

      <h1 className="mb-3 text-2xl font-semibold capitalize">{makeUnitName(unit)}</h1>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values }) => (
          <Form>
            <FormField label={t("status")}>
              <Select
                isClearable
                name="status"
                onChange={handleChange}
                value={values.status}
                values={codes10.values.map((v) => ({
                  label: v.value.value,
                  value: v.id,
                }))}
              />
            </FormField>

            <FormField label="Department">
              <Select
                name="department"
                onChange={handleChange}
                value={values.department}
                values={department.values.map((v) => ({
                  label: v.value.value,
                  value: v.id,
                }))}
              />
            </FormField>

            <FormField label={t("division")}>
              {"divisions" in unit ? (
                <Select
                  isMulti
                  value={values.divisions}
                  name="divisions"
                  onChange={handleChange}
                  values={division.values
                    .filter((v) =>
                      values.department ? v.departmentId === values.department : true,
                    )
                    .map((value) => ({
                      label: value.value.value,
                      value: value.id,
                    }))}
                />
              ) : (
                <Select
                  name="division"
                  onChange={handleChange}
                  value={values.division}
                  values={division.values
                    .filter((v) =>
                      values.department ? v.departmentId === values.department : true,
                    )
                    .map((value) => ({
                      label: value.value.value,
                      value: value.id,
                    }))}
                />
              )}
            </FormField>

            <FormField label={t("rank")}>
              <Select
                isClearable
                name="rank"
                onChange={handleChange}
                value={values.rank}
                values={officerRank.values.map((value) => ({
                  label: value.value,
                  value: value.id,
                }))}
              />
            </FormField>

            <FormField label={t("suspended")}>
              <Toggle onClick={handleChange} name="suspended" toggled={values.suspended} />
            </FormField>

            <footer className="flex justify-end">
              <Link href="/admin/manage/units">
                <a>
                  <Button type="button" variant="cancel">
                    {common("cancel")}
                  </Button>
                </a>
              </Link>
              <Button type="submit" className="flex items-center">
                {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}

                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>

      {"logs" in unit ? (
        <div className="mt-3">
          <h1 className="text-xl font-semibold">{t("officerLogs")}</h1>

          <Table
            data={unit.logs.map((log) => {
              const startedAt = format(new Date(log.startedAt), "yyyy-MM-dd HH:mm:ss");

              const endedAt = log.endedAt
                ? format(new Date(log.endedAt), "yyyy-MM-dd HH:mm:ss")
                : t("notEndedYet");

              const totalTime =
                log.endedAt !== null
                  ? `${formatDistance(new Date(log.endedAt), new Date(log.startedAt))}`
                  : t("notEndedYet");

              return {
                startedAt,
                endedAt,
                totalTime,
              };
            })}
            columns={[
              { Header: t("startedAt"), accessor: "startedAt" },
              { Header: t("endedAt"), accessor: "endedAt" },
              { Header: t("totalTime"), accessor: "totalTime" },
            ]}
          />
        </div>
      ) : null}
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, req, locale }) => {
  const [unit, values] = await requestAll(req, [
    [`/admin/manage/units/${query.id}`, null],
    ["/admin/values/codes_10?paths=department,division,officer_rank", []],
  ]);

  if (!unit) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      unit,
      values,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "leo", "ems-fd", "values", "common"], locale)),
      },
    },
  };
};
