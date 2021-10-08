import * as React from "react";
import { Formik, FormikHelpers } from "formik";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { useRouter } from "next/router";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { allowedFileExtensions, AllowedFileExtension } from "@snailycad/config";

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
import { Value, ValueType } from "types/prisma";
import { Select } from "components/form/Select";

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
  image: null,
};

interface Props {
  values: {
    type: ValueType;
    values: Value[];
  }[];
}

export default function CreateCitizen({ values }: Props) {
  const { state, execute } = useFetch();
  const router = useRouter();
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");
  const formRef = React.useRef<HTMLFormElement>(null);

  const genders = values.find((v) => v.type === "GENDER")?.values ?? [];
  const ethnicities = values.find((v) => v.type === "ETHNICITY")?.values ?? [];

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

    console.log({ values });
    console.log(fd?.get("image"));

    const { json } = await execute("/citizen", {
      method: "POST",
      data: values,
    });

    if (json?.id) {
      const uploadRes = await execute(`/citizen/${json.id}`, {
        method: "POST",
        data: fd,
      }).catch(() => null);

      if (!uploadRes?.json) {
        // todo: alert here that something failed; but continue
      }

      const path = `/citizen/${json.id}`;
      router.push(path);

      return;
    }

    // todo: add error alert
  }

  const validate = handleValidate(CREATE_CITIZEN_SCHEMA());

  return (
    <Layout>
      <h1 className="text-3xl mb-3 font-semibold">Create citizen</h1>

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
                  values={genders.map((gender) => ({
                    label: gender.value,
                    value: gender.value,
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
                    value: ethnicity.value,
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
              <FormField label={t("weight")}>
                <Input hasError={!!errors.weight} onChange={handleChange} name="weight" />
                <Error>{errors.weight}</Error>
              </FormField>

              <FormField label={t("height")}>
                <Input hasError={!!errors.height} onChange={handleChange} name="height" />
                <Error>{errors.height}</Error>
              </FormField>
            </FormRow>

            <FormField label={t("address")}>
              <Input hasError={!!errors.address} onChange={handleChange} name="address" />
              <Error>{errors.address}</Error>
            </FormField>

            {/* todo: setup select component */}
            {/* <FormRow>
              <FormField label="Driver License">
                <Input hasError={!!errors.address} onChange={handleChange} name="address" />
                <Error>{errors.address}</Error>
              </FormField>
              <FormField label="Firearms license">
                <Input hasError={!!errors.address} onChange={handleChange} name="address" />
                <Error>{errors.address}</Error>
              </FormField>
              <FormField label="Dmv">
                <Input hasError={!!errors.address} onChange={handleChange} name="address" />
                <Error>{errors.address}</Error>
              </FormField>
              <FormField label="Dmv">
                <Input hasError={!!errors.address} onChange={handleChange} name="address" />
                <Error>{errors.address}</Error>
              </FormField>
            </FormRow> */}

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
  // todo: update when needed, only gender and ethnicity are needed rn.
  const { data: values } = await handleRequest("/admin/values/gender?paths=ethnicity").catch(
    () => ({ data: null }),
  );

  console.log(values);

  return {
    props: {
      values: values ?? [],
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["citizen", "common"], locale)),
      },
    },
  };
};
