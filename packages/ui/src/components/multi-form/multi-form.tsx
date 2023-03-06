import * as React from "react";
import { FormikHelpers, Form, Formik, FormikConfig, FormikProps, FormikValues } from "formik";
import { classNames } from "../../utils/classNames";
import { Button } from "../button";
import { ArrowLeft, ArrowRight } from "react-bootstrap-icons";
import { MultiFormStep, MultiFormStepItem } from "./multi-form-step";

interface Props<FormValues extends FormikValues>
  extends Omit<FormikConfig<FormValues>, "children"> {
  children: ReturnType<typeof MultiFormStep>[];
  submitButton(state: {
    formikState: FormikProps<FormValues>;
    activeStep: React.ReactElement<MultiFormStepItem<FormValues>>;
  }): React.ReactNode;
  canceler?(formState: FormikProps<FormValues>): React.ReactNode;
  onStepChange?(step: React.ReactElement<MultiFormStepItem<FormValues>>): void;
}

function MultiForm<FormValues extends FormikValues>(props: Props<FormValues>) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [snapshot, setSnapshot] = React.useState<FormValues>(props.initialValues);
  const [submittedSteps, setSubmittedSteps] = React.useState<string[]>([]);

  const steps = React.Children.toArray(props.children);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  function handleSubmit(values: FormValues, formikHelpers: FormikHelpers<FormValues>) {
    const newHelpers = { ...formikHelpers, setCurrentStep };
    props.onSubmit(values, newHelpers);
  }

  const titles = React.useMemo(() => {
    return steps.map((step) => {
      if (React.isValidElement<MultiFormStepItem<FormValues>>(step)) {
        return step.props.title;
      }

      return null;
    });
  }, [steps]);

  const getActiveStep = React.useCallback(
    (formikState: any, stepNumber: number) => {
      const _step = steps[stepNumber];
      const elementProps = typeof _step === "object" && "props" in _step ? _step.props : {};

      const element = React.cloneElement(
        steps[stepNumber] as React.ReactElement<MultiFormStepItem<FormValues>>,
        {
          ...elementProps,
          formikState,
        },
      );
      return element;
    },
    [steps],
  );

  return (
    <Formik<FormValues> {...props} onSubmit={handleSubmit} initialValues={snapshot}>
      {(formikState) => {
        const activeStep = getActiveStep(formikState, currentStep);

        return (
          <div>
            <ul className="flex gap-2">
              {titles.map((title, idx) => {
                // conditional rendering of the steps
                // eslint-disable-next-line eqeqeq
                if (title == null) return null;

                const isActive = titles.indexOf(title) === currentStep;
                const hasBeenSubmitted = submittedSteps.includes(title);
                const stepNumber = idx + 1;

                return (
                  <li className={classNames("")} key={title}>
                    <button
                      disabled
                      type="button"
                      className={classNames(
                        "h-7",
                        hasBeenSubmitted || isActive
                          ? "text-blue-500"
                          : "text-neutral-600 dark:text-gray-400",
                      )}
                      onClick={() => setCurrentStep(idx)}
                    >
                      {stepNumber}. {title}
                    </button>
                    <span
                      className={classNames(
                        "block h-1 w-full rounded-sm",
                        hasBeenSubmitted || isActive
                          ? "bg-blue-500"
                          : "bg-neutral-600 dark:bg-gray-400",
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
                        props.onStepChange?.(getActiveStep(formikState, currentStep - 1));
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
                          props.onStepChange?.(getActiveStep(formikState, currentStep + 1));
                          setSnapshot(formikState.values);
                          setCurrentStep((p) => (p >= steps.length ? steps.length : p + 1));
                          setSubmittedSteps((p) => [...p, titles[currentStep]!]);
                        }
                      }}
                      className="flex gap-2 items-center"
                    >
                      Next <ArrowRight />
                    </Button>
                  )}
                  {isLastStep || (!isFirstStep && !activeStep.props.isRequired)
                    ? props.submitButton({ formikState, activeStep })
                    : null}
                </div>
              </footer>
            </Form>
          </div>
        );
      }}
    </Formik>
  );
}

export { MultiForm, MultiFormStep };
