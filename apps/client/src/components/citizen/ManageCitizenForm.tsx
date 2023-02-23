import * as React from "react";
import Link from "next/link";
import {
  Button,
  DatePickerField,
  Loader,
  TextField,
  MultiForm,
  MultiFormStep,
  AsyncListSearchField,
  Item,
} from "@snailycad/ui";
import { FormRow } from "components/form/FormRow";
import type { SelectValue } from "components/form/Select";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { CREATE_CITIZEN_SCHEMA, CREATE_CITIZEN_WITH_OFFICER_SCHEMA } from "@snailycad/schemas";
import { useAuth } from "context/AuthContext";
import { useValues } from "context/ValuesContext";
import { handleValidate } from "lib/handleValidate";
import type { FormikHelpers } from "formik";
import { User, Citizen, PenalCode, ValueType } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import {
  createDefaultLicensesValues,
  ManageLicensesFormFields,
} from "./licenses/ManageLicensesFormFields";
import parseISO from "date-fns/parseISO";
import { AddressPostalSelect } from "components/form/select/PostalSelect";
import { getManageOfficerFieldsDefaults } from "components/leo/manage-officer/manage-officer-fields";
import { CreateOfficerStep } from "./manage-citizen-form/create-officer-step";
import { CreatePreviousRecordsStep } from "./manage-citizen-form/create-previous-records-step";
import { Permissions, usePermission } from "hooks/usePermission";
import { ValueSelectField } from "components/form/inputs/value-select-field";

type FormFeatures =
  | "officer-creation"
  | "edit-user"
  | "edit-name"
  | "license-fields"
  | "previous-records";
interface Props {
  citizen: (Citizen & { user?: User | null }) | null;
  state: "error" | "loading" | null;
  formFeatures?: Partial<Record<FormFeatures, boolean>>;
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
  formFeatures,
  cancelURL = `/citizen/${citizen?.id}`,
}: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);
  const { cad } = useAuth();
  const { gender, ethnicity } = useValues();
  const features = useFeatureEnabled();
  const [validationSchema, setValidationSchema] = React.useState<any>(CREATE_CITIZEN_SCHEMA);
  const { hasPermissions } = usePermission();

  const validate = handleValidate(validationSchema);
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");

  const isNamesFieldDisabled =
    typeof formFeatures?.["edit-name"] !== "undefined" ? !formFeatures["edit-name"] : !!citizen;
  const weightPrefix = cad?.miscCadSettings?.weightPrefix
    ? `(${cad.miscCadSettings.weightPrefix})`
    : "";

  const heightPrefix = cad?.miscCadSettings?.heightPrefix
    ? `(${cad.miscCadSettings.heightPrefix})`
    : "";

  const INITIAL_VALUES = {
    ...getManageOfficerFieldsDefaults({ features, officer: null }),
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
    violations: [] as SelectValue<PenalCode>[],
    records: [],
    ...(formFeatures?.["license-fields"] ? createDefaultLicensesValues(citizen) : {}),
  };

  async function handleSubmit(
    data: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    let fd;
    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      if (typeof validatedImage !== "string") {
        fd = new FormData();
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    return onSubmit({ data, formData: fd, helpers });
  }

  return (
    <MultiForm
      onStepChange={(activeStep) => {
        const isOfficerStep = activeStep.props.id === "officer";

        const schema = isOfficerStep ? CREATE_CITIZEN_WITH_OFFICER_SCHEMA : CREATE_CITIZEN_SCHEMA;
        setValidationSchema(schema);
      }}
      validate={validate}
      onSubmit={handleSubmit}
      initialValues={INITIAL_VALUES}
      submitButton={({ formikState, activeStep }) => {
        const isOfficerStep = activeStep.props.title === "Officer";

        return (
          <>
            {isOfficerStep ? (
              <Button
                className="flex items-center gap-2"
                type="submit"
                disabled={!formikState.isValid || state === "loading"}
              >
                {state === "loading" ? <Loader /> : null}
                {t("createWithOfficer")}
              </Button>
            ) : null}

            <Button
              className="flex items-center gap-2"
              type="button"
              disabled={(!isOfficerStep && !formikState.isValid) || state === "loading"}
              onPress={() => {
                setValidationSchema(CREATE_CITIZEN_SCHEMA);

                setTimeout(() => {
                  formikState.submitForm();
                }, 10);
              }}
            >
              {state === "loading" ? <Loader /> : null}
              {citizen ? common("save") : common("create")}
            </Button>
          </>
        );
      }}
      canceler={() => (
        <Link href={citizen ? cancelURL : "/citizen"} className="mr-2 underline">
          {common("cancel")}
        </Link>
      )}
    >
      <MultiFormStep<typeof INITIAL_VALUES>
        title={t("basicInformation")}
        id="basic-information"
        isRequired
      >
        {({ values, errors, setValues, setFieldValue }) => (
          <>
            <ImageSelectInput image={image} setImage={setImage} />

            {formFeatures?.["edit-user"] ? (
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

            <FormRow flexLike={!features.SOCIAL_SECURITY_NUMBERS}>
              <DatePickerField
                errorMessage={errors.dateOfBirth as string}
                value={values.dateOfBirth}
                onChange={(value) => value && setFieldValue("dateOfBirth", value.toDate("UTC"))}
                label={t("dateOfBirth")}
              />

              {features.SOCIAL_SECURITY_NUMBERS ? (
                <TextField
                  value={values.socialSecurityNumber}
                  name="socialSecurityNumber"
                  isOptional
                  errorMessage={errors.socialSecurityNumber}
                  label={t("socialSecurityNumber")}
                  onChange={(value) => setFieldValue("socialSecurityNumber", value)}
                  isDisabled={!features.EDITABLE_SSN}
                  placeholder={features.EDITABLE_SSN ? undefined : common("autoGenerated")}
                />
              ) : null}
            </FormRow>

            <FormRow>
              <ValueSelectField
                fieldName="gender"
                valueType={ValueType.GENDER}
                values={gender.values}
                label={t("gender")}
              />

              <ValueSelectField
                fieldName="ethnicity"
                valueType={ValueType.ETHNICITY}
                values={ethnicity.values}
                label={t("ethnicity")}
              />
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

      <MultiFormStep<typeof INITIAL_VALUES>
        id="optional-information"
        title={t("optionalInformation")}
      >
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

      {formFeatures?.["license-fields"] && features.ALLOW_CITIZEN_UPDATE_LICENSE ? (
        <MultiFormStep id="license-information" title={t("licenseInformation")}>
          {() => (
            <FormRow flexLike>
              <ManageLicensesFormFields flexType="column" isLeo={false} allowRemoval />
            </FormRow>
          )}
        </MultiFormStep>
      ) : null}

      {formFeatures?.["previous-records"] && features.CITIZEN_CREATION_RECORDS ? (
        <MultiFormStep id="previous-records" title={t("previousRecords")}>
          {() => <CreatePreviousRecordsStep />}
        </MultiFormStep>
      ) : null}

      {formFeatures?.["officer-creation"] && hasPermissions([Permissions.Leo], (u) => u.isLeo) ? (
        <MultiFormStep id="officer" title={t("officer")}>
          {() => <CreateOfficerStep />}
        </MultiFormStep>
      ) : null}
    </MultiForm>
  );
}
