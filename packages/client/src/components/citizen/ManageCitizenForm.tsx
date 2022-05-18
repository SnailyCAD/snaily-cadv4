import * as React from "react";
import Link from "next/link";
import { Button } from "components/Button";
import { FormRow } from "components/form/FormRow";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Select } from "components/form/Select";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { useAuth } from "context/AuthContext";
import { useValues } from "context/ValuesContext";
import { handleValidate } from "lib/handleValidate";
import { Form, Formik, FormikHelpers } from "formik";
import { Citizen, DriversLicenseCategoryType, ValueLicenseType } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { Textarea } from "components/form/Textarea";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { filterLicenseTypes } from "lib/utils";

interface Props {
  citizen: Citizen | null;
  state: "error" | "loading" | null;
  showLicenseFields?: boolean;
  allowEditingName?: boolean;
  cancelURL?: string;
  onSubmit(arg0: {
    data: any;
    formData?: FormData;
    helpers: FormikHelpers<any>;
  }): void | Promise<void>;
}

export function ManageCitizenForm({
  onSubmit,
  state,
  citizen,
  allowEditingName,
  showLicenseFields,
  cancelURL = `/citizen/${citizen?.id}`,
}: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);
  const { cad } = useAuth();
  const { gender, ethnicity, license, driverslicenseCategory } = useValues();
  const { WEAPON_REGISTRATION, ALLOW_CITIZEN_UPDATE_LICENSE } = useFeatureEnabled();
  const validate = handleValidate(CREATE_CITIZEN_SCHEMA);
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");

  const isFieldDisabled = typeof allowEditingName !== "undefined" ? !allowEditingName : !!citizen;

  const weightPrefix = cad?.miscCadSettings?.weightPrefix
    ? `(${cad.miscCadSettings.weightPrefix})`
    : "";

  const heightPrefix = cad?.miscCadSettings?.heightPrefix
    ? `(${cad.miscCadSettings.heightPrefix})`
    : "";

  const INITIAL_VALUES = {
    name: citizen?.name ?? "",
    surname: citizen?.surname ?? "",
    dateOfBirth: citizen?.dateOfBirth ?? new Date(),
    gender: citizen?.genderId ?? "",
    ethnicity: citizen?.ethnicityId ?? "",
    weight: citizen?.weight ?? "",
    height: citizen?.height ?? "",
    hairColor: citizen?.hairColor ?? "",
    eyeColor: citizen?.eyeColor ?? "",
    address: citizen?.address ?? "",
    image: undefined,
    phoneNumber: citizen?.phoneNumber ?? "",
    postal: citizen?.postal ?? "",
    occupation: citizen?.occupation ?? "",

    driversLicense: citizen?.driversLicenseId ?? null,
    pilotLicense: citizen?.pilotLicenseId ?? null,
    weaponLicense: citizen?.weaponLicenseId ?? null,
    waterLicense: citizen?.waterLicenseId ?? null,

    driversLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.AUTOMOTIVE)
        .map((v) => ({
          value: v.id,
          label: v.value.value,
          description: v.description,
        })) ?? null,
    pilotLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.AVIATION)
        .map((v) => ({
          value: v.id,
          label: v.value.value,
          description: v.description,
        })) ?? null,
    waterLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.WATER)
        .map((v) => ({
          value: v.id,
          label: v.value.value,
          description: v.description,
        })) ?? null,
    firearmLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.FIREARM)
        .map((v) => ({
          value: v.id,
          label: v.value.value,
          description: v.description,
        })) ?? null,
  };

  async function handleSubmit(
    data: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    let fd;
    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      if (typeof validatedImage === "object") {
        fd = new FormData();
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    return onSubmit({ data, formData: fd, helpers });
  }

  return (
    <Formik validate={validate} onSubmit={handleSubmit} initialValues={INITIAL_VALUES}>
      {({ handleChange, values, errors, isValid }) => (
        <Form>
          <ImageSelectInput image={image} setImage={setImage} />

          <FormRow>
            <FormField errorMessage={errors.name} label={t("name")}>
              <Input
                value={values.name}
                onChange={handleChange}
                name="name"
                disabled={isFieldDisabled}
              />
            </FormField>

            <FormField errorMessage={errors.surname} label={t("surname")}>
              <Input
                value={values.surname}
                onChange={handleChange}
                name="surname"
                disabled={isFieldDisabled}
              />
            </FormField>
          </FormRow>

          <FormField errorMessage={errors.dateOfBirth as string} label={t("dateOfBirth")}>
            <Input
              type="date"
              value={
                isDate(values.dateOfBirth)
                  ? new Date(values.dateOfBirth.toString()).toISOString().slice(0, 10)
                  : String(values.dateOfBirth)
              }
              onChange={(e) =>
                handleChange({
                  ...e,
                  target: { name: "dateOfBirth", value: e.target.valueAsDate },
                })
              }
              name="dateOfBirth"
            />
          </FormField>

          <FormRow>
            <FormField errorMessage={errors.gender} label={t("gender")}>
              <Select
                name="gender"
                value={values.gender}
                onChange={handleChange}
                values={gender.values.map((gender) => ({
                  label: gender.value,
                  value: gender.id,
                }))}
              />
            </FormField>

            <FormField errorMessage={errors.ethnicity} label={t("ethnicity")}>
              <Select
                name="ethnicity"
                value={values.ethnicity}
                onChange={handleChange}
                values={ethnicity.values.map((ethnicity) => ({
                  label: ethnicity.value,
                  value: ethnicity.id,
                }))}
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField errorMessage={errors.hairColor} label={t("hairColor")}>
              <Input value={values.hairColor} onChange={handleChange} name="hairColor" />
            </FormField>

            <FormField errorMessage={errors.eyeColor} label={t("eyeColor")}>
              <Input value={values.eyeColor} onChange={handleChange} name="eyeColor" />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField errorMessage={errors.weight} label={`${t("weight")} ${weightPrefix}`}>
              <Input value={values.weight} onChange={handleChange} name="weight" />
            </FormField>

            <FormField errorMessage={errors.height} label={`${t("height")} ${heightPrefix}`}>
              <Input value={values.height} onChange={handleChange} name="height" />
            </FormField>
          </FormRow>

          <FormRow flexLike>
            <FormField className="w-full" errorMessage={errors.address} label={t("address")}>
              <Input value={values.address} onChange={handleChange} name="address" />
            </FormField>

            <FormField optional errorMessage={errors.postal} label={common("postal")}>
              <Input
                className="min-w-[300px]"
                name="postal"
                onChange={handleChange}
                value={values.postal}
              />
            </FormField>
          </FormRow>

          <FormField optional errorMessage={errors.phoneNumber} label={t("phoneNumber")}>
            <Input value={values.phoneNumber} onChange={handleChange} name="phoneNumber" />
          </FormField>

          <FormField optional errorMessage={errors.occupation} label={t("occupation")}>
            <Textarea name="occupation" onChange={handleChange} value={values.occupation} />
          </FormField>

          {showLicenseFields && ALLOW_CITIZEN_UPDATE_LICENSE ? (
            <FormRow flexLike className="mt-5">
              <FormField
                className="w-full"
                errorMessage={errors.driversLicense}
                label={t("driversLicense")}
              >
                <Select
                  isClearable
                  values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map((v) => ({
                    label: v.value,
                    value: v.id,
                  }))}
                  value={values.driversLicense}
                  onChange={handleChange}
                  name="driversLicense"
                />

                <FormField
                  errorMessage={errors.driversLicenseCategory as string}
                  className="mt-2"
                  label={t("driversLicenseCategory")}
                >
                  <Select
                    extra={{ showDLCategoryDescriptions: true }}
                    values={driverslicenseCategory.values
                      .filter((v) => v.type === DriversLicenseCategoryType.AUTOMOTIVE)
                      .map((category) => ({
                        label: category.value.value,
                        value: category.id,
                        description: category.description,
                      }))}
                    value={values.driversLicenseCategory}
                    onChange={handleChange}
                    name="driversLicenseCategory"
                    isMulti
                    isClearable
                  />
                </FormField>
              </FormField>

              {WEAPON_REGISTRATION ? (
                <FormField
                  className="w-full"
                  errorMessage={errors.weaponLicense}
                  label={t("weaponLicense")}
                >
                  <Select
                    isClearable
                    values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                      (v) => ({
                        label: v.value,
                        value: v.id,
                      }),
                    )}
                    value={values.weaponLicense}
                    onChange={handleChange}
                    name="weaponLicense"
                  />

                  <FormField
                    errorMessage={errors.firearmLicenseCategory as string}
                    className="mt-2"
                    label={t("firearmLicenseCategory")}
                  >
                    <Select
                      extra={{ showDLCategoryDescriptions: true }}
                      values={driverslicenseCategory.values
                        .filter((v) => v.type === DriversLicenseCategoryType.FIREARM)
                        .map((category) => ({
                          label: category.value.value,
                          value: category.id,
                          description: category.description,
                        }))}
                      value={values.firearmLicenseCategory}
                      onChange={handleChange}
                      name="firearmLicenseCategory"
                      isMulti
                      isClearable
                    />
                  </FormField>
                </FormField>
              ) : null}

              <FormField
                className="w-full"
                errorMessage={errors.pilotLicense}
                label={t("pilotLicense")}
              >
                <Select
                  isClearable
                  values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map((v) => ({
                    label: v.value,
                    value: v.id,
                  }))}
                  value={values.pilotLicense}
                  onChange={handleChange}
                  name="pilotLicense"
                />

                <FormField
                  errorMessage={errors.pilotLicenseCategory as string}
                  className="mt-2"
                  label={t("pilotLicenseCategory")}
                >
                  <Select
                    extra={{ showDLCategoryDescriptions: true }}
                    values={driverslicenseCategory.values
                      .filter((v) => v.type === DriversLicenseCategoryType.AVIATION)
                      .map((category) => ({
                        label: category.value.value,
                        value: category.id,
                        description: category.description,
                      }))}
                    value={values.pilotLicenseCategory}
                    onChange={handleChange}
                    name="pilotLicenseCategory"
                    isMulti
                    isClearable
                  />
                </FormField>
              </FormField>

              <FormField
                className="w-full"
                errorMessage={errors.waterLicense}
                label={t("waterLicense")}
              >
                <Select
                  isClearable
                  values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map((v) => ({
                    label: v.value,
                    value: v.id,
                  }))}
                  value={values.waterLicense}
                  onChange={handleChange}
                  name="waterLicense"
                />

                <FormField
                  errorMessage={errors.waterLicenseCategory as string}
                  className="mt-2"
                  label={t("waterLicenseCategory")}
                >
                  <Select
                    extra={{ showDLCategoryDescriptions: true }}
                    values={driverslicenseCategory.values
                      .filter((v) => v.type === DriversLicenseCategoryType.WATER)
                      .map((category) => ({
                        label: category.value.value,
                        value: category.id,
                        description: category.description,
                      }))}
                    value={values.waterLicenseCategory}
                    onChange={handleChange}
                    name="waterLicenseCategory"
                    isMulti
                    isClearable
                  />
                </FormField>
              </FormField>
            </FormRow>
          ) : null}

          <div className="flex items-center justify-end">
            <Link href={citizen ? cancelURL : "/citizen"}>
              <a className="mr-2 underline">{common("cancel")}</a>
            </Link>

            <Button
              className="flex items-center gap-2"
              type="submit"
              disabled={!isValid || state === "loading"}
            >
              {state === "loading" ? <Loader /> : null}
              {citizen ? common("save") : common("create")}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export function isDate(value: string | null | Date) {
  if (!value) return false;

  try {
    const date = new Date(value);
    return !!date;
  } catch {
    return false;
  }
}
