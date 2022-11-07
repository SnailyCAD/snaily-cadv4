import { FormikProps, FormikValues, useFormikContext } from "formik";

export function MultiFormStep<FormValues extends FormikValues>(props: {
  children(formikState: FormikProps<FormValues>): JSX.Element | null;
}) {
  const formikState = useFormikContext<FormValues>();
  return props.children(formikState);
}
