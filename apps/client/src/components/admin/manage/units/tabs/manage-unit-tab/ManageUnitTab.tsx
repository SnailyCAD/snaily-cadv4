import * as React from "react";
import { getUnitDepartment } from "lib/utils";
import { useTranslations } from "use-intl";
import { Form, Formik, FormikHelpers } from "formik";
import { FormField } from "components/form/FormField";
import { useValues } from "context/ValuesContext";
import { Select } from "components/form/Select";
import { Button, buttonVariants } from "components/Button";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { Toggle } from "components/form/Toggle";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/inputs/Input";
import { isUnitOfficer } from "@snailycad/utils";
import { classNames } from "lib/classNames";
import type { GetManageUnitByIdData, PutManageUnitData } from "@snailycad/types/api";
import { TabsContent } from "@radix-ui/react-tabs";
import { QualificationsTable } from "../../QualificationsTable";

interface Props {
  unit: GetManageUnitByIdData;
}

export function ManageUnitTab({ unit: data }: Props) {
  const [unit, setUnit] = React.useState(data);

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { codes10, department, division, officerRank } = useValues();
  const { state, execute } = useFetch();
  const router = useRouter();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const data = {
      ...values,
      divisions: values.divisions.map((v) => v.value),
    };

    const { json } = await execute<PutManageUnitData, typeof INITIAL_VALUES>({
      path: `/admin/manage/units/${unit.id}`,
      method: "PUT",
      data,
      helpers,
    });

    if (json.id) {
      toast.success("Updated.");
      router.push("/admin/manage/units");
    }
  }

  const divisions = isUnitOfficer(unit) ? unit.divisions : [];
  const INITIAL_VALUES = {
    status: unit.statusId,
    department: getUnitDepartment(unit)?.id ?? "",
    division: "divisionId" in unit ? unit.divisionId : "",
    divisions: divisions.map((v) => ({ value: v.id, label: v.value.value })),
    callsign: unit.callsign,
    callsign2: unit.callsign2,
    rank: unit.rankId,
    position: unit.position ?? "",
    suspended: unit.suspended,
    badgeNumber: unit.badgeNumber ?? "",
  };

  return (
    <TabsContent value="manage-unit">
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
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

            <FormField
              errorMessage={isUnitOfficer(unit) ? (errors.divisions as string) : errors.division}
              label={t("division")}
            >
              {isUnitOfficer(unit) ? (
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

            <FormRow>
              <FormField label={t("rank")}>
                <Select
                  isClearable
                  name="rank"
                  onChange={handleChange}
                  value={values.rank}
                  values={officerRank.values
                    .filter((v) => {
                      if ((v.officerRankDepartments?.length ?? 0) <= 0) return true;

                      return (
                        v.officerRankDepartments?.some((v) => v.id === values.department) ?? true
                      );
                    })
                    .map((value) => ({
                      label: value.value,
                      value: value.id,
                    }))}
                />
              </FormField>

              <FormField optional label={t("position")}>
                <Input name="position" onChange={handleChange} value={values.position} />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.badgeNumber} label={t("badgeNumber")}>
              <Input
                type="number"
                value={values.badgeNumber}
                name="badgeNumber"
                onChange={(e) =>
                  handleChange({
                    ...e,
                    target: {
                      ...e.target,
                      id: "badgeNumber",
                      value: e.target.valueAsNumber,
                    },
                  })
                }
              />
            </FormField>

            <FormRow>
              <FormField errorMessage={errors.callsign} label={"Callsign Symbol 1"}>
                <Input value={values.callsign} name="callsign" onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.callsign2} label={"Callsign Symbol 2"}>
                <Input value={values.callsign2} name="callsign2" onChange={handleChange} />
              </FormField>
            </FormRow>

            <FormField label={t("suspended")}>
              <Toggle onCheckedChange={handleChange} name="suspended" value={values.suspended} />
            </FormField>

            <footer className="flex justify-end">
              <Link href="/admin/manage/units">
                <a
                  href="/admin/manage/units"
                  className={classNames(buttonVariants.cancel, "p-1 px-4 rounded-md")}
                >
                  {common("cancel")}
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

      <QualificationsTable setUnit={setUnit} unit={unit} />
    </TabsContent>
  );
}
