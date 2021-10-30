import * as React from "react";
import { Formik, FormikHelpers } from "formik";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { useRouter } from "next/router";
import { useTranslations } from "use-intl";
import Link from "next/link";
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
import { handleRequest } from "lib/fetch";
import { Citizen, Value, ValueType } from "types/prisma";
import { Select } from "components/form/Select";
import { useCitizen } from "context/CitizenContext";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";

interface Props {
  values: {
    type: ValueType;
    values: Value[];
  }[];
}

export default function EditCitizen({ values }: Props) {
  const { state, execute } = useFetch();
  const router = useRouter();
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");
  const formRef = React.useRef<HTMLFormElement>(null);

  const { citizen } = useCitizen();
  const genders = values.find((v) => v.type === "GENDER")?.values ?? [];
  const ethnicities = values.find((v) => v.type === "ETHNICITY")?.values ?? [];

  React.useEffect(() => {
    if (!citizen) {
      console.log("citizen not found");
    }
  }, [citizen]);

  if (!citizen) {
    return null;
  }

  const INITIAL_VALUES = {
    name: citizen.name,
    surname: citizen.surname,
    dateOfBirth: citizen.dateOfBirth,
    gender: citizen.genderId,
    ethnicity: citizen.ethnicityId,
    weight: citizen.weight,
    height: citizen.height,
    hairColor: citizen.hairColor,
    eyeColor: citizen.eyeColor,
    address: citizen.address,
    image: undefined,
    phoneNumber: citizen.phoneNumber,
  };

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!citizen) return;

    const fd = formRef.current && new FormData(formRef.current);
    const image = fd?.get("image") as File;

    if (image && image.size && image.name) {
      if (!allowedFileExtensions.includes(image.type as AllowedFileExtension)) {
        helpers.setFieldError("image", `Only ${allowedFileExtensions.join(", ")} are supported`);
      }
    }

    const { json } = await execute(`/citizen/${citizen.id}`, {
      method: "PUT",
      data: values,
    });

    if (image && image.size && image.name) {
      await execute(`/citizen/${citizen.id}`, {
        method: "POST",
        data: fd,
      });
    }

    if (json?.id) {
      router.push(`/citizen/${json.id}`);
    }
  }

  const validate = handleValidate(CREATE_CITIZEN_SCHEMA);

  return (
    <Layout>
      <Head>
        <title>
          {t("editCitizen")} - {citizen.name} {citizen.surname}
        </title>
      </Head>
      <h1 className="text-3xl mb-3 font-semibold">{t("editCitizen")}</h1>

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
                  className="bg-red-400 hover:bg-red-500"
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
                <Input
                  value={values.name}
                  hasError={!!errors.name}
                  onChange={handleChange}
                  name="name"
                  disabled
                />
                <Error>{errors.name}</Error>
              </FormField>

              <FormField label={t("surname")}>
                <Input
                  value={values.surname}
                  hasError={!!errors.surname}
                  onChange={handleChange}
                  name="surname"
                  disabled
                />
                <Error>{errors.surname}</Error>
              </FormField>
            </FormRow>

            <FormField label={t("dateOfBirth")}>
              <Input
                type="date"
                value={new Date(values.dateOfBirth.toString()).toISOString().slice(0, 10)}
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
                  values={genders.map((gender) => ({
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
                  values={ethnicities.map((ethnicity) => ({
                    label: ethnicity.value,
                    value: ethnicity.id,
                  }))}
                />

                <Error>{errors.ethnicity}</Error>
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label={t("eyeColor")}>
                <Input
                  value={values.eyeColor}
                  hasError={!!errors.hairColor}
                  onChange={handleChange}
                  name="hairColor"
                />
                <Error>{errors.hairColor}</Error>
              </FormField>

              <FormField label={t("hairColor")}>
                <Input
                  value={values.hairColor}
                  hasError={!!errors.eyeColor}
                  onChange={handleChange}
                  name="eyeColor"
                />
                <Error>{errors.eyeColor}</Error>
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label={t("weight")}>
                <Input
                  value={values.weight}
                  hasError={!!errors.weight}
                  onChange={handleChange}
                  name="weight"
                />
                <Error>{errors.weight}</Error>
              </FormField>

              <FormField label={t("height")}>
                <Input
                  value={values.height}
                  hasError={!!errors.height}
                  onChange={handleChange}
                  name="height"
                />
                <Error>{errors.height}</Error>
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label={t("address")}>
                <Input
                  value={values.address}
                  hasError={!!errors.address}
                  onChange={handleChange}
                  name="address"
                />
                <Error>{errors.address}</Error>
              </FormField>

              <FormField label={t("phoneNumber")}>
                <Input
                  value={values.phoneNumber ?? ""}
                  hasError={!!errors.phoneNumber}
                  onChange={handleChange}
                  name="phoneNumber"
                />
                <Error>{errors.phoneNumber}</Error>
              </FormField>
            </FormRow>

            <div className="flex items-center justify-end">
              <Link href={`/citizen/${citizen.id}`}>
                <a className="mr-2 underline">{common("cancel")}</a>
              </Link>

              <Button
                className="flex items-center gap-2"
                type="submit"
                disabled={!isValid || state === "loading"}
              >
                {state === "loading" ? <Loader /> : null} {common("save")}
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const { data: values = [] } = await handleRequest("/admin/values/gender?paths=ethnicity").catch(
    () => ({ data: null }),
  );

  const { data } = await handleRequest<Citizen>(`/citizen/${query.id}`, {
    headers: req.headers,
  }).catch(() => ({ data: null }));

  return {
    props: {
      values,
      citizen: data,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["citizen", "common"], locale)),
      },
    },
  };
};
