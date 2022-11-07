import * as React from "react";
import Link from "next/link";
import {
  Button,
  DatePickerField,
  Input,
  Loader,
  TextField,
  MultiForm,
  MultiFormStep,
  AsyncListSearchField,
  Item,
} from "@snailycad/ui";
import { FormRow } from "components/form/FormRow";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { useAuth } from "context/AuthContext";
import { useValues } from "context/ValuesContext";
import { handleValidate } from "lib/handleValidate";
import type { FormikHelpers } from "formik";
import type { User, Citizen } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import {
  createDefaultLicensesValues,
  ManageLicensesFormFields,
} from "./licenses/ManageLicensesFormFields";
import parseISO from "date-fns/parseISO";
import { AddressPostalSelect } from "components/form/select/PostalSelect";

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
    <MultiForm
      titles={[
        "Basic Information",
        "Optional Information",
        showLicenseFields && ALLOW_CITIZEN_UPDATE_LICENSE ? "License Information" : null,
      ]}
      validate={validate}
      onSubmit={handleSubmit}
      initialValues={INITIAL_VALUES}
      submitButton={({ isValid }) => (
        <Button
          className="flex items-center gap-2"
          type="submit"
          disabled={!isValid || state === "loading"}
        >
          {state === "loading" ? <Loader /> : null}
          {citizen ? common("save") : common("create")}
        </Button>
      )}
      canceler={() => (
        <Link href={citizen ? cancelURL : "/citizen"} className="mr-2 underline">
          {common("cancel")}
        </Link>
      )}
    >
      <MultiFormStep<typeof INITIAL_VALUES>>
        {({ values, errors, setValues, setFieldValue, handleChange }) => (
          <>
            <ImageSelectInput image={image} setImage={setImage} />

            {allowEditingUser ? (
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

            <FormRow>
              <TextField
                errorMessage={errors.name}
                label={t("name")}
                value={values.name}
                onChange={(value) => setFieldValue("name", value)}
                name="name"
                isDisabled={isNamesFieldDisabled}
              />

              <TextField
                errorMessage={errors.surname}
                label={t("surname")}
                value={values.surname}
                onChange={(value) => setFieldValue("surname", value)}
                name="surname"
                isDisabled={isNamesFieldDisabled}
              />
            </FormRow>

            <FormRow flexLike={!SOCIAL_SECURITY_NUMBERS}>
              <DatePickerField
                errorMessage={errors.dateOfBirth as string}
                value={values.dateOfBirth}
                onChange={(value) => value && setFieldValue("dateOfBirth", value.toDate("UTC"))}
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
              <TextField
                errorMessage={errors.hairColor}
                label={t("hairColor")}
                value={values.hairColor}
                onChange={(value) => setFieldValue("hairColor", value)}
                name="hairColor"
              />

              <TextField
                errorMessage={errors.eyeColor}
                label={t("eyeColor")}
                value={values.eyeColor}
                onChange={(value) => setFieldValue("eyeColor", value)}
                name="eyeColor"
              />
            </FormRow>

            <FormRow>
              <TextField
                errorMessage={errors.weight}
                label={`${t("weight")} ${weightPrefix}`}
                value={values.weight}
                onChange={(value) => setFieldValue("weight", value)}
                name="weight"
              />

              <TextField
                errorMessage={errors.height}
                label={`${t("height")} ${heightPrefix}`}
                value={values.height}
                onChange={(value) => setFieldValue("height", value)}
                name="height"
              />
            </FormRow>

            <AddressPostalSelect addressOptional={false} />
          </>
        )}
      </MultiFormStep>

      <MultiFormStep<typeof INITIAL_VALUES>>
        {({ values, errors, setFieldValue }) => (
          <>
            <TextField
              isOptional
              errorMessage={errors.phoneNumber}
              label={t("phoneNumber")}
              value={values.phoneNumber}
              onChange={(value) => setFieldValue("phoneNumber", value)}
              name="phoneNumber"
            />

            <TextField
              isTextarea
              isOptional
              errorMessage={errors.occupation}
              label={t("occupation")}
              name="occupation"
              onChange={(value) => setFieldValue("occupation", value)}
              value={values.occupation}
            />

            <TextField
              isTextarea
              isOptional
              errorMessage={errors.additionalInfo}
              label={t("additionalInfo")}
              name="additionalInfo"
              onChange={(value) => setFieldValue("additionalInfo", value)}
              value={values.additionalInfo}
            />
          </>
        )}
      </MultiFormStep>

      {showLicenseFields && ALLOW_CITIZEN_UPDATE_LICENSE ? (
        <MultiFormStep>
          {() => (
            <FormRow flexLike>
              <ManageLicensesFormFields flexType="column" isLeo={false} allowRemoval />
            </FormRow>
          )}
        </MultiFormStep>
      ) : null}
    </MultiForm>
  );
}
