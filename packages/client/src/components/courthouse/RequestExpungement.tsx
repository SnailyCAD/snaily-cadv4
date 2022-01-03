import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Citizen, Warrant } from "types/prisma";
import { useCitizen } from "context/CitizenContext";
import { Select } from "components/form/Select";
import { FullRecord } from "components/leo/modals/NameSearchModal/RecordsArea";

type Result = Citizen & { Record: FullRecord[]; warrants: Warrant[] };

export function RequestExpungement() {
  const { state, execute } = useFetch();
  const { closeModal, isOpen } = useModal();
  const { citizens } = useCitizen();

  const [result, setResult] = React.useState<false | null | Result>(null);

  const t = useTranslations("Courthouse");
  const leo = useTranslations("Leo");
  const common = useTranslations("Common");

  function handleClose() {
    setResult(null);
    closeModal(ModalIds.RequestExpungement);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute(`/expungement-requests/${values.citizenId}`, {
      method: "GET",
      noToast: true,
    });

    if (json.id) {
      setResult(json);
    } else {
      setResult(false);
    }
  }

  const INITIAL_VALUES = {
    citizenId: "",
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.RequestExpungement)}
      onClose={handleClose}
      title={t("requestExpungement")}
      className="w-[600px]"
    >
      <div>
        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, values, errors, isValid }) => (
            <Form className="flex items-center gap-2">
              <FormField className="w-full" errorMessage={errors.citizenId} label={leo("citizen")}>
                <Select
                  values={citizens.map((v) => ({
                    value: v.id,
                    label: `${v.name} ${v.surname}`,
                  }))}
                  value={values.citizenId}
                  autoFocus
                  name="citizenId"
                  onChange={handleChange}
                />
              </FormField>

              <Button
                className="flex items-center mt-4"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("search")}
              </Button>
            </Form>
          )}
        </Formik>
      </div>

      {result === false ? (
        <p>Citizen not found</p>
      ) : result ? (
        <ResultsForm handleClose={handleClose} result={result} />
      ) : null}
    </Modal>
  );
}

function ResultsForm({ result, handleClose }: { handleClose(): void; result: Result }) {
  const { state, execute } = useFetch();
  const leo = useTranslations("Leo");
  const common = useTranslations("Common");

  const arrestReports = result.Record.filter((v) => v.type === "ARREST_REPORT");
  const tickets = result.Record.filter((v) => v.type === "TICKET");

  const isDisabled =
    arrestReports.length <= 0 && tickets.length <= 0 && result.warrants.length <= 0;

  function getTitles(record: FullRecord) {
    const titles = record.violations.map((v) => v.penalCode.title);
    return titles.join(", ");
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute(`/expungement-requests/${result.id}`, {
      data: values,
      method: "GET",
      noToast: true,
    });

    console.log({ json });
  }

  const INITIAL_VALUES = {
    warrants: [],
    tickets: [],
    arrestReports: [],
  };

  return (
    <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
      {({ handleChange, values, errors, isValid }) => (
        <Form>
          <FormField
            className="w-full"
            errorMessage={errors.warrants as string}
            label={leo("warrants")}
          >
            <Select
              values={result.warrants.map((v) => ({
                value: v.id,
                label: v.description,
              }))}
              value={values.warrants}
              name="warrants"
              onChange={handleChange}
            />
          </FormField>

          <FormField
            className="w-full"
            errorMessage={errors.arrestReports as string}
            label={leo("arrestReports")}
          >
            <Select
              values={arrestReports.map((v) => ({
                value: v.id,
                label: getTitles(v),
              }))}
              value={values.arrestReports}
              name="arrestReports"
              onChange={handleChange}
            />
          </FormField>

          <FormField
            className="w-full"
            errorMessage={errors.tickets as string}
            label={leo("tickets")}
          >
            <Select
              values={tickets.map((v) => ({
                value: v.id,
                label: getTitles(v),
              }))}
              value={values.tickets}
              name="tickets"
              onChange={handleChange}
            />
          </FormField>

          <footer className="flex justify-end mt-5">
            <Button onClick={handleClose} variant="cancel" type="reset">
              {common("cancel")}
            </Button>
            <Button
              className="flex items-center"
              disabled={isDisabled || !isValid || state === "loading"}
              type="submit"
            >
              {state === "loading" ? <Loader className="mr-2" /> : null}
              {common("search")}
            </Button>
          </footer>
        </Form>
      )}
    </Formik>
  );
}
