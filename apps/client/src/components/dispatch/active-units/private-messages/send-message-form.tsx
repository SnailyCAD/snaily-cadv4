import { Button, Loader, TextField } from "@snailycad/ui";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";

interface Props {
  unitId: string;
}

export function SendMessageForm(props: Props) {
  const { state, execute } = useFetch();
  const t = useTranslations("Leo");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute({
      path: `/dispatch/private-message/${props.unitId}`,
      method: "POST",
      data: values,
    });

    console.log(json);
  }

  const INITIAL_VALUES = {
    message: "",
    // todo: support 911-calls, incidents and searches being sent
  };

  return (
    <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
      {({ values, errors, setFieldValue }) => (
        <Form className="mt-20">
          <TextField
            label={t("message")}
            value={values.message}
            onChange={(value) => setFieldValue("message", value)}
            errorMessage={errors.message}
            isTextarea
          />

          <footer className="flex mt-5 justify-end">
            <Button disabled={state === "loading"} className="flex items-center ml-2" type="submit">
              {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}
              {t("send")}
            </Button>
          </footer>
        </Form>
      )}
    </Formik>
  );
}
