import * as React from "react";
import { getUnitDepartment } from "lib/utils";
import { useTranslations } from "use-intl";
import { Form, Formik, FormikHelpers } from "formik";
import { FormField } from "components/form/FormField";
import { useValues } from "context/ValuesContext";
import { Select } from "components/form/Select";
import {
  Loader,
  Button,
  buttonVariants,
  TextField,
  AsyncListSearchField,
  Item,
} from "@snailycad/ui";
import useFetch from "lib/useFetch";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { Toggle } from "components/form/Toggle";
import { FormRow } from "components/form/FormRow";
import { isUnitOfficer } from "@snailycad/utils";
import { classNames } from "lib/classNames";
import type { GetManageUnitByIdData, PutManageUnitData } from "@snailycad/types/api";
import { TabsContent } from "@radix-ui/react-tabs";
import { QualificationsTable } from "../../QualificationsTable";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { usePermission, Permissions } from "hooks/usePermission";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import type { User } from "@snailycad/types";

interface Props {
  unit: GetManageUnitByIdData;
}

export function ManageUnitTab({ unit: data }: Props) {
  const [image, setImage] = React.useState<null | File | string>(null);
  const [unit, setUnit] = React.useState(data);

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { codes10, department, division, officerRank } = useValues();
  const { state, execute } = useFetch();
  const router = useRouter();
  const { BADGE_NUMBERS, DIVISIONS } = useFeatureEnabled();

  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageUnits], true);
  const hasManageAwardsPermissions = hasPermissions(
    [Permissions.ManageAwardsAndQualifications],
    true,
  );

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const data = {
      ...values,
      divisions: values.divisions.map((v) => v.value),
    };

    const validatedImage = validateFile(image, helpers);
    const formData = new FormData();

    if (validatedImage) {
      if (typeof validatedImage !== "string") {
        formData.set("image", validatedImage, validatedImage.name);
      }
    }

    const { json } = await execute<PutManageUnitData, typeof INITIAL_VALUES>({
      path: `/admin/manage/units/${unit.id}`,
      method: "PUT",
      data,
      helpers,
    });

    if (json.id) {
      if (formData.has("image")) {
        await execute({
          path: `/admin/manage/units/${unit.id}/image`,
          method: "POST",
          data: formData,
        });
      }

      toast.success("Updated.");
      router.push("/admin/manage/units");
    }
  }

  const divisions = isUnitOfficer(unit) ? unit.divisions : [];
  const INITIAL_VALUES = {
    userId: unit.userId ?? "",
    username: unit.user?.username ?? "",

    status: unit.statusId,
    department: getUnitDepartment(unit)?.id ?? "",
    division: "divisionId" in unit ? unit.divisionId : "",
    divisions: divisions.map((v) => ({ value: v.id, label: v.value.value })),
    callsign: unit.callsign,
    callsign2: unit.callsign2,
    rank: unit.rankId,
    position: unit.position ?? "",
    suspended: unit.suspended,
    badgeNumber: BADGE_NUMBERS ? unit.badgeNumber ?? undefined : undefined,
  };

  return (
    <TabsContent value="manage-unit">
      {hasManagePermissions ? (
        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ setFieldValue, handleChange, setValues, values, errors }) => (
            <Form>
              {unit.isTemporary && !unit.user ? (
                <AsyncListSearchField<User>
                  autoFocus
                  setValues={({ localValue, node }) => {
                    setValues({
                      ...values,
                      userId: node?.value.id ?? values.userId,
                      username: localValue ?? values.username,
                    });
                  }}
                  localValue={values.username}
                  errorMessage={errors.username}
                  label="User"
                  selectedKey={values.userId}
                  fetchOptions={{
                    apiPath: "/admin/manage/users/search",
                    method: "POST",
                    bodyKey: "username",
                  }}
                >
                  {(item) => (
                    <Item key={item.id} textValue={item.username}>
                      <p>{item.username}</p>
                    </Item>
                  )}
                </AsyncListSearchField>
              ) : null}

              <ImageSelectInput setImage={setImage} image={image} />

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

              {DIVISIONS ? (
                <FormField
                  errorMessage={
                    isUnitOfficer(unit) ? (errors.divisions as string) : errors.division
                  }
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
              ) : null}

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

                <TextField
                  errorMessage={errors.position}
                  label={t("position")}
                  name="position"
                  onChange={(value) => setFieldValue("position", value)}
                  value={values.position}
                />
              </FormRow>

              {BADGE_NUMBERS ? (
                <TextField
                  errorMessage={errors.badgeNumber}
                  label={t("badgeNumber")}
                  name="badgeNumber"
                  onChange={(value) => {
                    isNaN(Number(value))
                      ? setFieldValue("badgeNumber", value)
                      : setFieldValue("badgeNumber", parseInt(value));
                  }}
                  value={String(values.badgeNumber)}
                />
              ) : null}

              <FormRow>
                <TextField
                  errorMessage={errors.callsign}
                  label={t("callsign1")}
                  name="callsign"
                  onChange={(value) => setFieldValue("callsign", value)}
                  value={values.callsign}
                />

                <TextField
                  errorMessage={errors.callsign2}
                  label={t("callsign2")}
                  name="callsign2"
                  onChange={(value) => setFieldValue("callsign2", value)}
                  value={values.callsign2}
                />
              </FormRow>

              <FormField label={t("suspended")}>
                <Toggle onCheckedChange={handleChange} name="suspended" value={values.suspended} />
              </FormField>

              <footer className="flex justify-end">
                <Link
                  href="/admin/manage/units"
                  className={classNames(buttonVariants.cancel, "p-1 px-4 rounded-md")}
                >
                  {common("cancel")}
                </Link>

                <Button type="submit" className="flex items-center">
                  {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}
                  {common("save")}
                </Button>
              </footer>
            </Form>
          )}
        </Formik>
      ) : null}

      {hasManageAwardsPermissions || hasManagePermissions ? (
        <QualificationsTable
          hasManagePermissions={hasManagePermissions}
          setUnit={setUnit}
          unit={unit}
        />
      ) : null}
    </TabsContent>
  );
}
