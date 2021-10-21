import { Form, Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Select } from "components/form/Select";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import { useLeoState } from "state/leoState";
import { StatusEnum } from "types/prisma";

export const CreateWarrant = () => {
  const { activeOfficer } = useLeoState();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute("/records/create-warrant", {
      method: "POST",
      data: values,
    });

    if (json.id) {
      // todo: alert success
      helpers.resetForm();
    }
  }

  const INITIAL_VALUES = {
    citizenId: "",
    status: "",
    description: "",
  };

  return (
    <div className="bg-gray-200/50 rounded-md overflow-hidden">
      <header>
        <header className="bg-gray-300/50 px-4 p-2">
          <h3 className="text-xl font-semibold">{"Create Warrant"}</h3>
        </header>

        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, values, errors, isValid }) => (
            <Form className="p-4">
              <FormField label="Name">
                <Input
                  name="citizenId"
                  onChange={handleChange}
                  value={values.citizenId}
                  hasError={!!errors.citizenId}
                />
              </FormField>

              <FormField label="Status">
                <Select
                  values={[
                    { label: "Active", value: "ACTIVE" },
                    { label: "Inactive", value: "INACTIVE" },
                  ]}
                  name="status"
                  onChange={handleChange}
                  hasError={!!errors.status}
                  value={values.status}
                />
              </FormField>

              <FormField label={common("description")}>
                <Textarea
                  className="h-14"
                  id="description"
                  onChange={handleChange}
                  hasError={!!errors.description}
                  value={values.description}
                />
              </FormField>

              <Button
                disabled={
                  !isValid ||
                  !activeOfficer ||
                  activeOfficer.status === StatusEnum.OFF_DUTY ||
                  state === "loading"
                }
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("create")}
              </Button>
            </Form>
          )}
        </Formik>
      </header>
    </div>
  );
};
