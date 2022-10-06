import * as React from "react";
import Link from "next/link";
import { Textarea, Loader, Input, Button } from "@snailycad/ui";
import { FormRow } from "components/form/FormRow";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { useAuth } from "context/AuthContext";
import { useValues } from "context/ValuesContext";
import { handleValidate } from "lib/handleValidate";
import { Form, Formik, FormikHelpers } from "formik";
import type { User, Citizen } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import {
  createDefaultLicensesValues,
  ManageLicensesFormFields,
} from "./licenses/ManageLicensesFormFields";
import { DatePickerField } from "components/form/inputs/DatePicker/DatePickerField";
import parseISO from "date-fns/parseISO";

interface Props {
  citizen: (Citizen & { user?: User | null }) | null;
  state: "error" | "loading" | null;
  showLicenseFields?: boolean;
  allowEditingName?: boolean;
  allowEditingUser?: boolean;
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
  allowEditingUser,
  cancelURL = `/citizen/${citizen?.id}`,
}: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);
  const { cad } = useAuth();
  const { gender, ethnicity } = useValues();
  const { SOCIAL_SECURITY_NUMBERS, ALLOW_CITIZEN_UPDATE_LICENSE } = useFeatureEnabled();
  const validate = handleValidate(CREATE_CITIZEN_SCHEMA);
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");

  const isNamesFieldDisabled =
    typeof allowEditingName !== "undefined" ? !allowEditingName : !!citizen;
  const weightPrefix = cad?.miscCadSettings?.weightPrefix
    ? `(${cad.miscCadSettings.weightPrefix})`
    : "";

  const heightPrefix = cad?.miscCadSettings?.heightPrefix
    ? `(${cad.miscCadSettings.heightPrefix})`
    : "";

  const INITIAL_VALUES = {
    userId: citizen?.userId ?? "",
    username: citizen?.user?.username ?? "",
    name: citizen?.name ?? "",
    surname: citizen?.surname ?? "",
    dateOfBirth:
      typeof citizen?.dateOfBirth === "string" ? parseISO(citizen.dateOfBirth) : undefined,
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
    additionalInfo: citizen?.additionalInfo ?? "",
    socialSecurityNumber: citizen?.socialSecurityNumber ?? "",
    ...createDefaultLicensesValues(citizen),
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
      {({ handleChange, setValues, setFieldValue, values, errors, isValid }) => (
        <Form>
          {allowEditingUser ? (
            <FormField errorMessage={errors.userId} label="User">
              <InputSuggestions<User>
                options={{
                  apiPath: "/admin/manage/users/search",
                  method: "POST",
                  dataKey: "username",
                }}
                inputProps={{
                  value: values.username,
                  name: "username",
                  onChange: handleChange,
                }}
                onSuggestionPress={(suggestion) => {
                  setValues({ ...values, userId: suggestion.id, username: suggestion.username });
                }}
                Component={({ suggestion }) => <p className="flex ">{suggestion.username}</p>}
              />
            </FormField>
          ) : null}

          <ImageSelectInput image={image} setImage={setImage} />

          <FormRow>
            <FormField errorMessage={errors.name} label={t("name")}>
              <Input
                value={values.name}
                onChange={handleChange}
                name="name"
                disabled={isNamesFieldDisabled}
              />
            </FormField>

            <FormField errorMessage={errors.surname} label={t("surname")}>
              <Input
                value={values.surname}
                onChange={handleChange}
                name="surname"
                disabled={isNamesFieldDisabled}
              />
            </FormField>
          </FormRow>

          <FormRow flexLike={!SOCIAL_SECURITY_NUMBERS}>
            <DatePickerField
              errorMessage={errors.dateOfBirth as string}
              value={values.dateOfBirth}
              onChange={(value) =>
                value && setFieldValue("dateOfBirth", parseISO(value?.toString()))
              }
              label={t("dateOfBirth")}
            />

            {SOCIAL_SECURITY_NUMBERS ? (
              <FormField
                errorMessage={errors.socialSecurityNumber}
                label={t("socialSecurityNumber")}
                optional
              >
                <Input
                  value={values.socialSecurityNumber}
                  onChange={handleChange}
                  name="socialSecurityNumber"
                />
              </FormField>
            ) : null}
          </FormRow>

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

          <FormField optional errorMessage={errors.additionalInfo} label={t("additionalInfo")}>
            <Textarea name="additionalInfo" onChange={handleChange} value={values.additionalInfo} />
          </FormField>

          {showLicenseFields && ALLOW_CITIZEN_UPDATE_LICENSE ? (
            <FormRow flexLike className="mt-5">
              <ManageLicensesFormFields flexType="column" isLeo={false} allowRemoval />
            </FormRow>
          ) : null}

          <div className="flex items-center justify-end">
            <Link href={citizen ? cancelURL : "/citizen"}>
              <a href={citizen ? cancelURL : "/citizen"} className="mr-2 underline">
                {common("cancel")}
              </a>
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
