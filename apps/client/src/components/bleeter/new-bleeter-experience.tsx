import { Button, Loader, TextField } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { FormRow } from "components/form/FormRow";
import { Title } from "components/shared/Title";
import { Form, Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";

export function NewBleeterExperienceForm() {
  const t = useTranslations("Bleeter");
  const { state, execute } = useFetch();

  async function handleSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute({
      path: "/bleeter/new-experience/profile",
      data: values,
      helpers,
      method: "POST",
    });

    console.log({ json });
  }

  const INITIAL_VALUES = {
    name: "",
    handle: "",
    bio: "",
  };

  return (
    <Layout className="dark:text-white !max-w-4xl">
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("bleeter")}</Title>
      </header>

      <div>
        <p className="dark:text-gray-400 text-neutral-700 my-2 max-w-2xl">
          Bleeter has been updated to include Bleeter Profiles. You can now create a profile and
          post bleets to your profile. All your previous posts will be migrated to your profile.
          <br /> You can now also follow other users and see their bleets on your feed.
        </p>

        <Formik onSubmit={handleSubmit} initialValues={INITIAL_VALUES}>
          {({ values, errors, setFieldValue }) => (
            <Form className="mt-5">
              <FormRow>
                <TextField
                  placeholder="@"
                  label="Handle"
                  value={values.handle}
                  errorMessage={errors.handle}
                  onChange={(value) => setFieldValue("handle", value)}
                />

                <TextField
                  label="Name"
                  value={values.name}
                  errorMessage={errors.name}
                  onChange={(value) => setFieldValue("name", value)}
                />
              </FormRow>

              <TextField
                label="Bio"
                value={values.bio}
                errorMessage={errors.bio}
                onChange={(value) => setFieldValue("bio", value)}
                isTextarea
              />

              <footer className="flex justify-end">
                <Button
                  className="flex gap-2 items-center"
                  disabled={state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader /> : null}
                  Get started
                </Button>
              </footer>
            </Form>
          )}
        </Formik>
      </div>
    </Layout>
  );
}
