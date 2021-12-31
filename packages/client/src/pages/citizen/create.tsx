import * as React from "react";
import { Formik, FormikHelpers } from "formik";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { useRouter } from "next/router";
import { useTranslations } from "use-intl";
import Link from "next/link";
import Head from "next/head";

import { Button } from "components/Button";
import { FormRow } from "components/form/FormRow";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Layout } from "components/Layout";
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import { requestAll } from "lib/utils";
import { useAuth } from "context/AuthContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { ImageSelectInput, validateFile } from "components/form/ImageSelectInput";

const INITIAL_VALUES = {
  name: "",
  surname: "",
  dateOfBirth: "",
  gender: "",
  ethnicity: "",
  weight: "",
  height: "",
  hairColor: "",
  eyeColor: "",
  address: "",
  driversLicense: "",
  pilotLicense: "",
  ccw: "",
  weaponLicense: "",
  image: null,
  driversLicenseCategory: "",
  pilotLicenseCategory: "",
  phoneNumber: "",
};

export default function CreateCitizen() {
  const [image, setImage] = React.useState<File | string | null>(null);

  const { state, execute } = useFetch();
  const router = useRouter();
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");
  const { cad } = useAuth();
  const { gender, ethnicity, license, driverslicenseCategory } = useValues();
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const fd = new FormData();
    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      if (typeof validatedImage === "object") {
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    const { json } = await execute("/citizen", {
      method: "POST",
      data: {
        ...values,
        driversLicenseCategory: Array.isArray(values.driversLicenseCategory)
          ? values.driversLicenseCategory.map((v) => v.value)
          : values.driversLicenseCategory,
        pilotLicenseCategory: Array.isArray(values.pilotLicenseCategory)
          ? values.pilotLicenseCategory.map((v) => v.value)
          : values.pilotLicenseCategory,
      },
    });

    if (json?.id) {
      if (validatedImage && typeof validatedImage === "object") {
        await execute(`/citizen/${json.id}`, {
          method: "POST",
          data: fd,
        });
      }

      const path = `/citizen/${json.id}`;
      router.push(path);
    }
  }

  const weightPrefix = cad?.miscCadSettings?.weightPrefix
    ? `(${cad?.miscCadSettings.weightPrefix})`
    : "";

  const heightPrefix = cad?.miscCadSettings?.heightPrefix
    ? `(${cad?.miscCadSettings.heightPrefix})`
    : "";

  const validate = handleValidate(CREATE_CITIZEN_SCHEMA);

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>Create Citizen</title>
      </Head>
      <h1 className="mb-3 text-3xl font-semibold">Create citizen</h1>

      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, values, errors, isValid }) => (
          <form onSubmit={handleSubmit}>
            <ImageSelectInput image={image} setImage={setImage} />

            <FormRow>
              <FormField errorMessage={errors.name} label={t("name")}>
                <Input onChange={handleChange} name="name" />
              </FormField>

              <FormField errorMessage={errors.surname} label={t("surname")}>
                <Input onChange={handleChange} name="surname" />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.dateOfBirth} label={t("dateOfBirth")}>
              <Input
                type="date"
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
                <Input onChange={handleChange} name="hairColor" />
              </FormField>

              <FormField errorMessage={errors.eyeColor} label={t("eyeColor")}>
                <Input onChange={handleChange} name="eyeColor" />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField errorMessage={errors.weight} label={`${t("weight")} ${weightPrefix}`}>
                <Input onChange={handleChange} name="weight" />
              </FormField>

              <FormField errorMessage={errors.height} label={`${t("height")} ${heightPrefix}`}>
                <Input onChange={handleChange} name="height" />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField errorMessage={errors.address} label={t("address")}>
                <Input onChange={handleChange} name="address" />
              </FormField>

              <FormField optional errorMessage={errors.phoneNumber} label={t("phoneNumber")}>
                <Input onChange={handleChange} name="phoneNumber" />
              </FormField>
            </FormRow>

            <FormRow className="mt-5">
              <FormField errorMessage={errors.driversLicense} label={t("driversLicense")}>
                <Select
                  values={license.values.map((v) => ({
                    label: v.value,
                    value: v.id,
                  }))}
                  value={values.driversLicense}
                  onChange={handleChange}
                  name="driversLicense"
                />

                <FormField
                  errorMessage={errors.driversLicenseCategory}
                  className="mt-2"
                  label="Type"
                >
                  <Select
                    values={driverslicenseCategory.values
                      .filter((v) => v.type === "AUTOMOTIVE")
                      .map((v) => ({
                        label: v.value.value,
                        value: [v.id, v.type].join("-"),
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
                <FormField errorMessage={errors.weaponLicense} label={t("weaponLicense")}>
                  <Select
                    values={license.values.map((v) => ({
                      label: v.value,
                      value: v.id,
                    }))}
                    value={values.weaponLicense}
                    onChange={handleChange}
                    name="weaponLicense"
                  />
                </FormField>
              ) : null}

              <FormField errorMessage={errors.pilotLicense} label={t("pilotLicense")}>
                <Select
                  values={license.values.map((v) => ({
                    label: v.value,
                    value: v.id,
                  }))}
                  value={values.pilotLicense}
                  onChange={handleChange}
                  name="pilotLicense"
                />

                <FormField errorMessage={errors.pilotLicenseCategory} className="mt-2" label="Type">
                  <Select
                    values={driverslicenseCategory.values
                      .filter((v) => v.type === "AVIATION")
                      .map((v) => ({
                        label: v.value.value,
                        value: [v.id, v.type].join("-"),
                      }))}
                    value={values.pilotLicenseCategory}
                    onChange={handleChange}
                    name="pilotLicenseCategory"
                    isMulti
                    isClearable
                  />
                </FormField>
              </FormField>

              {WEAPON_REGISTRATION ? (
                <FormField errorMessage={errors.ccw} label={t("ccw")}>
                  <Select
                    values={license.values.map((v) => ({
                      label: v.value,
                      value: v.id,
                    }))}
                    value={values.ccw}
                    onChange={handleChange}
                    name="ccw"
                  />
                </FormField>
              ) : null}
            </FormRow>

            <div className="flex items-center justify-end">
              <Link href="/citizen">
                <a className="mr-2 underline">{common("cancel")}</a>
              </Link>

              <Button
                className="flex items-center gap-2"
                type="submit"
                disabled={!isValid || state === "loading"}
              >
                {state === "loading" ? <Loader /> : null} {t("createCitizen")}
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [values] = await requestAll(req, [
    ["/admin/values/gender?paths=ethnicity,license,driverslicense_category", []],
  ]);

  return {
    props: {
      values,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "common"], locale)),
      },
    },
  };
};
