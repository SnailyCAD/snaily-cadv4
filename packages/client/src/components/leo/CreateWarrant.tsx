import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useLeoState } from "state/leoState";
import { StatusEnum } from "types/prisma";
import { useTranslations } from "use-intl";

export const CreateWarrant = () => {
  const { activeOfficer } = useLeoState();
  const { state } = useFetch();
  const common = useTranslations("Common");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    values;
  }

  const INITIAL_VALUES = {
    name: "",
    status: "",
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
                  name="name"
                  onChange={handleChange}
                  value={values.name}
                  hasError={!!errors.name}
                />
              </FormField>

              <FormField label="Status">
                <Select
                  values={[{ label: "Active", value: "ACTIVE" }]}
                  name="status"
                  onChange={handleChange}
                  value={values.status}
                  hasError={!!errors.status}
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
