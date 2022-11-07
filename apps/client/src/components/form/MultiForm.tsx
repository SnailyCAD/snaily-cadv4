import * as React from "react";
import { Form, Formik, FormikConfig, FormikProps, FormikValues, useFormikContext } from "formik";
import { classNames } from "lib/classNames";
import { Button } from "@snailycad/ui";
import { ArrowLeft, ArrowRight } from "react-bootstrap-icons";

interface Props<FormValues extends FormikValues>
  extends Omit<FormikConfig<FormValues>, "children"> {
  children: ReturnType<typeof MultiFormStep>[];
  titles: (string | null)[];
  submitButton(formState: FormikProps<FormValues>): React.ReactNode;
  canceler?(formState: FormikProps<FormValues>): React.ReactNode;
}

export function MultiFormStep<FormValues extends FormikValues>(props: {
  children(formikState: FormikProps<FormValues>): JSX.Element | null;
}) {
  const formikState = useFormikContext<FormValues>();
  return props.children(formikState);
}

export function MultiForm<FormValues extends FormikValues>(props: Props<FormValues>) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [snapshot, setSnapshot] = React.useState<FormValues>(props.initialValues);

  const steps = React.Children.toArray(props.children);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const getActiveStep = React.useCallback(
    (formikState: any) => {
      return React.cloneElement(steps[currentStep] as React.ReactElement, { formikState });
    },
    [currentStep, steps],
  );

  return (
    <Formik<FormValues> {...props} initialValues={snapshot}>
      {(formikState) => {
        const activeStep = getActiveStep(formikState);

        return (
          <div>
            <ul className="flex gap-2">
              {props.titles.map((title, idx) => {
                // conditional rendering of the steps
                // eslint-disable-next-line eqeqeq
                if (title == null) return null;

                const isActive = props.titles.indexOf(title) === currentStep;
                const stepNumber = idx + 1;

                return (
                  <li className={classNames("")} key={title}>
                    <button
                      disabled
                      type="button"
                      className={classNames(
                        "h-7",
                        isActive ? "text-blue-500" : "text-neutral-600 dark:text-gray-400",
                      )}
                      onClick={() => setCurrentStep(idx)}
                    >
                      {stepNumber}. {title}
                    </button>
                    <span
                      className={classNames(
                        "block h-1 w-full rounded-sm",
                        isActive ? "bg-blue-500" : "bg-neutral-600 dark:bg-gray-400",
                      )}
                    />
                  </li>
                );
              })}
            </ul>

            <Form className="mt-5">
              {activeStep}

              <footer className="flex items-center justify-between">
                <div>{props.canceler ? props.canceler(formikState) : null}</div>

                <div className="flex gap-2">
                  {isFirstStep ? null : (
                    <Button
                      onPress={() => {
                        setCurrentStep((p) => (p <= 0 ? 0 : p - 1));
                      }}
                      className="flex gap-2 items-center"
                    >
                      <ArrowLeft /> Previous
                    </Button>
                  )}
                  {isLastStep ? null : (
                    <Button
                      onPress={async () => {
                        const errors = await formikState.validateForm();
                        if (Object.keys(errors).length === 0) {
                          setSnapshot(formikState.values);
                          setCurrentStep((p) => (p >= steps.length ? steps.length : p + 1));
                        }
                      }}
                      className="flex gap-2 items-center"
                    >
                      Next <ArrowRight />
                    </Button>
                  )}
                  {isLastStep ? props.submitButton(formikState) : null}
                </div>
              </footer>
            </Form>
          </div>
        );
      }}
    </Formik>
  );
}
