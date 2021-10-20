import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Loader } from "components/Loader";
import { useAuth } from "context/AuthContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";

export const UpdateAreaOfPlay = () => {
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { cad, setCad } = useAuth();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/dispatch/aop", {
      method: "POST",
      data: values,
    });

    if (json) {
      setCad({ ...cad, ...json });
    }
  }

  const INITIAL_VALUES = {
    aop: "",
  };

  return (
    <div className="bg-gray-200/50 rounded-md overflow-hidden">
      <header>
        <header className="bg-gray-300/50 px-4 p-2">
          <h3 className="text-xl font-semibold">{t("updateAOP")}</h3>
        </header>

        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, values, errors, isValid }) => (
            <Form className="p-4">
              <FormField fieldId="aop" label="Area of Play">
                <Input
                  id="aop"
                  onChange={handleChange}
                  value={values.aop}
                  hasError={!!errors.aop}
                  required
                />
              </FormField>

              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("save")}
              </Button>
            </Form>
          )}
        </Formik>
      </header>
    </div>
  );
};
