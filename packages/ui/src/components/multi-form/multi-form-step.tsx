import { FormikProps, FormikValues, useFormikContext } from "formik";

export interface MultiFormStepItem<FormValues extends FormikValues> {
  title: string;
  id: string;
  isRequired?: boolean;
  children(formikState: FormikProps<FormValues>): JSX.Element | null;
}

export function MultiFormStep<FormValues extends FormikValues>(
  props: MultiFormStepItem<FormValues>,
) {
  const formikState = useFormikContext<FormValues>();
  return props.children(formikState);
}
