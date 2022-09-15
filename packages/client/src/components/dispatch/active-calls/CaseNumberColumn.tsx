import * as React from "react";
import { Modal } from "components/modal/Modal";
import { ContextMenu } from "components/shared/ContextMenu";
import type { Full911Call } from "state/dispatch/dispatchState";
import { Form, Formik } from "formik";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { useCall911State } from "state/dispatch/call911State";
import useFetch from "lib/useFetch";
import { Button } from "components/Button";
import { Loader } from "components/Loader";
import { useTranslations } from "next-intl";

interface Props {
  call: Full911Call;
}

export function CaseNumberColumn({ call }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ContextMenu
        items={[
          {
            name: "Merge Call with...",
            onClick: () => {
              setIsOpen(true);
            },
          },
        ]}
      >
        #{call.caseNumber}
      </ContextMenu>

      {isOpen ? <MergeCallModal call={call} handleClose={() => setIsOpen(false)} /> : null}
    </>
  );
}

interface MergeCallModalProps {
  call: Full911Call;
  handleClose(): void;
}

function MergeCallModal({ call, handleClose }: MergeCallModalProps) {
  const call911State = useCall911State();
  const { state, execute } = useFetch();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  const caseNumbers = React.useMemo(() => {
    return call911State.calls
      .filter((_call) => _call.id !== call.id)
      .map((call) => ({ value: call, label: `#${call.caseNumber}` }));
  }, [call911State.calls, call]);

  async function handleSubmit(data: { call: Full911Call | null }) {
    console.log({ data });

    const { json } = await execute({
      method: "POST",
      path: `/911-calls/merge/${call.id}`,
      data: {
        callId: data.call,
      },
    });

    console.log({ json });
  }

  return (
    <Modal className="min-w-[500px]" title="Merge call" isOpen onClose={handleClose}>
      <Formik onSubmit={handleSubmit} initialValues={{ call: null as Full911Call | null }}>
        {({ values, errors, handleChange }) => (
          <Form>
            <FormField errorMessage={errors.call as string} label="Case numbers">
              <Select
                name="call"
                onChange={handleChange}
                value={
                  values.call ? { label: `#${values.call.caseNumber}`, value: values.call } : null
                }
                values={caseNumbers}
              />
            </FormField>

            {values.call ? (
              <p>
                Call <b>#{values.call.caseNumber}</b> will be merged into call{" "}
                <b>#{call.caseNumber}</b>
              </p>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("merge")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
