import * as React from "react";
import { Formik, FormikHelpers } from "formik";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { useRouter } from "next/router";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { allowedFileExtensions, AllowedFileExtension } from "@snailycad/config";
import Head from "next/head";

import { Button } from "components/Button";
import { Error } from "components/form/Error";
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
  const { state, execute } = useFetch();
  const router = useRouter();
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");
  const formRef = React.useRef<HTMLFormElement>(null);
  const { cad } = useAuth();

  const { gender, ethnicity, license, driverslicenseCategory } = useValues();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const fd = formRef.current && new FormData(formRef.current);
    const image = fd?.get("image") as File;

    if (image && image.size && image.name) {
      if (!allowedFileExtensions.includes(image.type as AllowedFileExtension)) {
        helpers.setFieldError("image", `Only ${allowedFileExtensions.join(", ")} are supported`);
      }
    }

    const { json } = await execute("/citizen", {
      method: "POST",
      data: {
        ...values,
        driversLicenseCategory: Array.isArray(values.pilotLicenseCategory)
          ? values.pilotLicenseCategory.map((v) => v.value)
          : values.pilotLicenseCategory,
        pilotLicenseCategory: Array.isArray(values.pilotLicenseCategory)
          ? values.pilotLicenseCategory.map((v) => v.value)
          : values.pilotLicenseCategory,
      },
    });

    if (json?.id) {
      if (image && image.size && image.name) {
        await execute(`/citizen/${json.id}`, {
          method: "POST",
          data: fd,
        });
      }

      const path = `/citizen/${json.id}`;
      router.push(path);
    }
  }

  const validate = handleValidate(CREATE_CITIZEN_SCHEMA);

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>Create Citizen</title>
      </Head>
      <h1 className="mb-3 text-3xl font-semibold">Create citizen</h1>

      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, setFieldValue, values, errors, isValid }) => (
          <form ref={formRef} onSubmit={handleSubmit}>
            <FormField label={t("image")}>
              <div className="flex">
                <Input
                  style={{ width: "95%", marginRight: "0.5em" }}
                  onChange={handleChange}
                  type="file"
                  name="image"
                  value={values.image ?? ""}
                />
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setFieldValue("image", "");
                  }}
                >
                  {common("delete")}
                </Button>
              </div>
              <Error>{errors.image}</Error>
            </FormField>

            <FormRow>
              <FormField label={t("name")}>
                <Input hasError={!!errors.name} onChange={handleChange} name="name" />
                <Error>{errors.name}</Error>
              </FormField>

              <FormField label={t("surname")}>
                <Input hasError={!!errors.surname} onChange={handleChange} name="surname" />
                <Error>{errors.surname}</Error>
              </FormField>
            </FormRow>

            <FormField label={t("dateOfBirth")}>
              <Input
                type="date"
                hasError={!!errors.dateOfBirth}
                onChange={(e) =>
                  handleChange({
                    ...e,
                    target: { name: "dateOfBirth", value: e.target.valueAsDate },
                  })
                }
                name="dateOfBirth"
              />
              <Error>{errors.dateOfBirth}</Error>
            </FormField>

            <FormRow>
              <FormField label={t("gender")}>
                <Select
                  name="gender"
                  value={values.gender}
                  onChange={handleChange}
                  hasError={!!errors.gender}
                  values={gender.values.map((gender) => ({
                    label: gender.value,
                    value: gender.id,
                  }))}
                />
                <Error>{errors.gender}</Error>
              </FormField>

              <FormField label={t("ethnicity")}>
                <Select
                  name="ethnicity"
                  value={values.ethnicity}
                  onChange={handleChange}
                  hasError={!!errors.ethnicity}
                  values={ethnicity.values.map((ethnicity) => ({
                    label: ethnicity.value,
                    value: ethnicity.id,
                  }))}
                />

                <Error>{errors.ethnicity}</Error>
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label={t("eyeColor")}>
                <Input hasError={!!errors.hairColor} onChange={handleChange} name="hairColor" />
                <Error>{errors.hairColor}</Error>
              </FormField>

              <FormField label={t("hairColor")}>
                <Input hasError={!!errors.eyeColor} onChange={handleChange} name="eyeColor" />
                <Error>{errors.eyeColor}</Error>
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label={`${t("weight")} (${cad?.miscCadSettings.weightPrefix})`}>
                <Input hasError={!!errors.weight} onChange={handleChange} name="weight" />
                <Error>{errors.weight}</Error>
              </FormField>

              <FormField label={`${t("height")} (${cad?.miscCadSettings.heightPrefix})`}>
                <Input hasError={!!errors.height} onChange={handleChange} name="height" />
                <Error>{errors.height}</Error>
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label={t("address")}>
                <Input hasError={!!errors.address} onChange={handleChange} name="address" />
                <Error>{errors.address}</Error>
              </FormField>

              <FormField label={t("phoneNumber")}>
                <Input hasError={!!errors.phoneNumber} onChange={handleChange} name="phoneNumber" />
                <Error>{errors.phoneNumber}</Error>
              </FormField>
            </FormRow>

            <FormRow className="mt-5">
              <FormField label={t("driversLicense")}>
                <Select
                  values={license.values.map((v) => ({
                    label: v.value,
                    value: v.id,
                  }))}
                  value={values.driversLicense}
                  hasError={!!errors.driversLicense}
                  onChange={handleChange}
                  name="driversLicense"
                />
                <Error>{errors.driversLicense}</Error>

                <FormField className="mt-2" label="Type">
                  <Select
                    values={driverslicenseCategory.values
                      .filter((v) => v.type === "AUTOMOTIVE")
                      .map((v) => ({
                        label: v.value.value,
                        value: v.id,
                      }))}
                    value={values.driversLicenseCategory}
                    hasError={!!errors.driversLicenseCategory}
                    onChange={handleChange}
                    name="driversLicenseCategory"
                    isMulti
                    isClearable
                  />
                </FormField>
              </FormField>
              <FormField label={t("weaponLicense")}>
                <Select
                  values={license.values.map((v) => ({
                    label: v.value,
                    value: v.id,
                  }))}
                  value={values.weaponLicense}
                  hasError={!!errors.weaponLicense}
                  onChange={handleChange}
                  name="weaponLicense"
                />
                <Error>{errors.weaponLicense}</Error>
              </FormField>
              <FormField label={t("pilotLicense")}>
                <Select
                  values={license.values.map((v) => ({
                    label: v.value,
                    value: v.id,
                  }))}
                  value={values.pilotLicense}
                  hasError={!!errors.pilotLicense}
                  onChange={handleChange}
                  name="pilotLicense"
                />
                <Error>{errors.pilotLicense}</Error>

                <FormField className="mt-2" label="Type">
                  <Select
                    values={driverslicenseCategory.values
                      .filter((v) => v.type === "AVIATION")
                      .map((v) => ({
                        label: v.value.value,
                        value: v.id,
                      }))}
                    value={values.pilotLicenseCategory}
                    hasError={!!errors.pilotLicenseCategory}
                    onChange={handleChange}
                    name="pilotLicenseCategory"
                    isMulti
                    isClearable
                  />
                </FormField>
              </FormField>
              <FormField label={t("ccw")}>
                <Select
                  values={license.values.map((v) => ({
                    label: v.value,
                    value: v.id,
                  }))}
                  value={values.ccw}
                  hasError={!!errors.ccw}
                  onChange={handleChange}
                  name="ccw"
                />
                <Error>{errors.ccw}</Error>
              </FormField>
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
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["citizen", "common"], locale)),
      },
    },
  };
};
