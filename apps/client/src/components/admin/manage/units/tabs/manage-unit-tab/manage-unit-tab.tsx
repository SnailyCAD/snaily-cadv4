import * as React from "react";
import { getUnitDepartment } from "lib/utils";
import { useTranslations } from "use-intl";
import { Form, Formik, type FormikHelpers } from "formik";
import { useValues } from "context/ValuesContext";
import {
  Loader,
  Button,
  buttonVariants,
  TextField,
  AsyncListSearchField,
  Item,
  SwitchField,
  FormRow,
  SelectField,
  TabsContent,
} from "@snailycad/ui";
import useFetch from "lib/useFetch";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { isUnitOfficer } from "@snailycad/utils";
import type { GetManageUnitByIdData, PutManageUnitData } from "@snailycad/types/api";
import { QualificationsTable } from "../../QualificationsTable";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { usePermission, Permissions } from "hooks/usePermission";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { ValueType, type User, WhitelistStatus } from "@snailycad/types";
import { ValueSelectField } from "components/form/inputs/value-select-field";

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
  const hasManagePermissions = hasPermissions([Permissions.ManageUnits]);
  const hasManageAwardsPermissions = hasPermissions([Permissions.ManageAwardsAndQualifications]);

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
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
      data: values,
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
  const areFormFieldsDisabled = unit.whitelistStatus?.status === WhitelistStatus.PENDING;

  const INITIAL_VALUES = {
    userId: unit.userId ?? "",
    username: unit.user?.username ?? "",
    status: unit.statusId,
    department: getUnitDepartment(unit)?.id ?? "",
    division: !isUnitOfficer(unit) ? unit.divisionId : null,
    divisions: divisions.map((v) => v.id),
    callsign: unit.callsign,
    callsign2: unit.callsign2,
    rank: unit.rankId,
    position: unit.position ?? "",
    suspended: unit.suspended,
    badgeNumberString: BADGE_NUMBERS ? (unit.badgeNumberString ?? "") : undefined,
  };

  return (
    <TabsContent value="manage-unit">
      {hasManagePermissions ? (
        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ setFieldValue, setValues, values, errors }) => (
            <Form>
              {unit.isTemporary && !unit.user ? (
                <AsyncListSearchField<User>
                  autoFocus
                  isDisabled={areFormFieldsDisabled}
                  onInputChange={(value) => setFieldValue("username", value)}
                  onSelectionChange={(node) => {
                    setValues({
                      ...values,
                      userId: node?.value?.id ?? values.userId,
                      username: node?.value?.username ?? values.username,
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

              <ValueSelectField
                isDisabled={areFormFieldsDisabled}
                label={t("status")}
                fieldName="status"
                values={codes10.values}
                valueType={ValueType.CODES_10}
                isClearable
              />

              <ValueSelectField
                isDisabled={areFormFieldsDisabled}
                label={t("department")}
                fieldName="department"
                values={department.values}
                valueType={ValueType.DEPARTMENT}
                isClearable
              />

              {DIVISIONS ? (
                isUnitOfficer(unit) ? (
                  <SelectField
                    isDisabled={areFormFieldsDisabled}
                    errorMessage={errors.divisions}
                    label={t("division")}
                    selectedKeys={values.divisions}
                    onSelectionChange={(keys) => setFieldValue("divisions", keys)}
                    options={division.values
                      .filter((value) =>
                        values.department ? value.departmentId === values.department : true,
                      )
                      .map((value) => ({
                        value: value.id,
                        label: value.value.value,
                      }))}
                    selectionMode="multiple"
                  />
                ) : (
                  <ValueSelectField
                    fieldName="division"
                    label={t("division")}
                    values={division.values}
                    valueType={ValueType.DIVISION}
                    filterFn={(value) =>
                      values.department ? value.departmentId === values.department : true
                    }
                  />
                )
              ) : null}

              <FormRow>
                <ValueSelectField
                  isDisabled={areFormFieldsDisabled}
                  label={t("rank")}
                  fieldName="rank"
                  values={officerRank.values}
                  valueType={ValueType.OFFICER_RANK}
                  isClearable
                  filterFn={(value) => {
                    // has no departments set - allows all departments
                    if (!value.officerRankDepartments || value.officerRankDepartments.length <= 0) {
                      return true;
                    }

                    return values.department
                      ? value.officerRankDepartments.some((v) => v.id === values.department)
                      : true;
                  }}
                />

                <TextField
                  isDisabled={areFormFieldsDisabled}
                  errorMessage={errors.position}
                  label={t("position")}
                  name="position"
                  onChange={(value) => setFieldValue("position", value)}
                  value={values.position}
                />
              </FormRow>

              {BADGE_NUMBERS ? (
                <TextField
                  isDisabled={areFormFieldsDisabled}
                  errorMessage={errors.badgeNumberString}
                  label={t("badgeNumber")}
                  name="badgeNumberString"
                  onChange={(value) => setFieldValue("badgeNumberString", value)}
                  value={values.badgeNumberString}
                />
              ) : null}

              <FormRow>
                <TextField
                  isDisabled={areFormFieldsDisabled}
                  errorMessage={errors.callsign}
                  label={t("callsign1")}
                  name="callsign"
                  onChange={(value) => setFieldValue("callsign", value)}
                  value={values.callsign}
                />

                <TextField
                  isDisabled={areFormFieldsDisabled}
                  errorMessage={errors.callsign2}
                  label={t("callsign2")}
                  name="callsign2"
                  onChange={(value) => setFieldValue("callsign2", value)}
                  value={values.callsign2}
                />
              </FormRow>

              <SwitchField
                isDisabled={areFormFieldsDisabled}
                className="mt-3"
                isSelected={values.suspended}
                onChange={(isSelected) => setFieldValue("suspended", isSelected)}
              >
                {t("suspended")}
              </SwitchField>

              <footer className="flex justify-end">
                <Link href="/admin/manage/units" className={buttonVariants({ variant: "cancel" })}>
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
          areFormFieldsDisabled={areFormFieldsDisabled}
          hasManagePermissions={hasManagePermissions}
          setUnit={setUnit}
          unit={unit}
        />
      ) : null}
    </TabsContent>
  );
}
