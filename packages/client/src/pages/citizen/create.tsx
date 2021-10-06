import { Formik } from "formik";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { useRouter } from "next/router";

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

const INITIAL_VALUES = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  ethnicity: "",
  weight: "",
  height: "",
  hairColor: "",
  eyeColor: "",
  address: "",
};

export default function CreateCitizen() {
  const { state, execute } = useFetch();
  const router = useRouter();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/citizen", {
      method: "POST",
      data: values,
    });

    if (json?.id) {
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
        {({ handleSubmit, handleChange, errors, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField label="Full Name">
              <Input hasError={!!errors.fullName} onChange={handleChange} name="fullName" />
              <Error>{errors.fullName}</Error>
            </FormField>

            <FormField label="Date Of Birth">
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
              <FormField label="Gender">
                <Input hasError={!!errors.gender} onChange={handleChange} name="gender" />
                <Error>{errors.gender}</Error>
              </FormField>

              <FormField label="Ethnicity">
                <Input hasError={!!errors.ethnicity} onChange={handleChange} name="ethnicity" />
                <Error>{errors.ethnicity}</Error>
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label="Eye Color">
                <Input hasError={!!errors.hairColor} onChange={handleChange} name="hairColor" />
                <Error>{errors.hairColor}</Error>
              </FormField>

              <FormField label="Hair Color">
                <Input hasError={!!errors.eyeColor} onChange={handleChange} name="eyeColor" />
                <Error>{errors.eyeColor}</Error>
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label="Weight">
                <Input hasError={!!errors.weight} onChange={handleChange} name="weight" />
                <Error>{errors.weight}</Error>
              </FormField>

              <FormField label="Height">
                <Input hasError={!!errors.height} onChange={handleChange} name="height" />
                <Error>{errors.height}</Error>
              </FormField>
            </FormRow>

            <FormField label="Address">
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

            <Button
              className="flex items-center gap-2"
              type="submit"
              disabled={!isValid || state === "loading"}
            >
              {state === "loading" ? <Loader /> : null} Create Citizen
            </Button>
          </form>
        )}
      </Formik>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  return {
    props: {
      session: await getSessionUser(req.headers),
    },
  };
};
