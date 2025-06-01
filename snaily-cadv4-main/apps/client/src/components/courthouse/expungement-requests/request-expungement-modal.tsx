import * as React from "react";
import { Loader, Button, SelectField, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/modal-ids";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type {
  PostExpungementRequestByCitizenIdData,
  GetManageExpungementRequests,
  GetExpungementRequestByCitizenIdData,
} from "@snailycad/types/api";

export function RequestExpungement({
  onSuccess,
}: {
  onSuccess(json: PostExpungementRequestByCitizenIdData): void;
}) {
  const { state, execute } = useFetch();
  const modalState = useModal();

  const [result, setResult] = React.useState<false | null | GetExpungementRequestByCitizenIdData>(
    null,
  );

  const t = useTranslations("Courthouse");
  const common = useTranslations("Common");

  function handleClose() {
    setResult(null);
    modalState.closeModal(ModalIds.RequestExpungement);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<GetExpungementRequestByCitizenIdData>({
      path: `/expungement-requests/${values.citizenId}`,
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
    citizenName: "",
  };

  return (
    <Modal
      isOpen={modalState.isOpen(ModalIds.RequestExpungement)}
      onClose={handleClose}
      title={t("requestExpungement")}
      className="w-[600px]"
    >
      <div>
        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ values }) => (
            <Form className="flex items-center gap-2">
              <CitizenSuggestionsField
                autoFocus
                allowsCustomValue
                label={common("citizen")}
                fromAuthUserOnly
                labelFieldName="citizenName"
                valueFieldName="citizenId"
              />

              <Button
                className="flex items-center mt-4 h-10"
                disabled={!values.citizenId || state === "loading"}
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
        <ResultsForm onSuccess={onSuccess} handleClose={handleClose} result={result} />
      ) : null}
    </Modal>
  );
}

interface ResultProps {
  handleClose(): void;
  result: GetExpungementRequestByCitizenIdData;
  onSuccess(json: PostExpungementRequestByCitizenIdData): void;
}

function ResultsForm({ result, onSuccess, handleClose }: ResultProps) {
  const { state, execute } = useFetch();
  const leo = useTranslations("Leo");
  const t = useTranslations("Courthouse");
  const common = useTranslations("Common");

  const arrestReports = result.Record.filter((v) => v.type === "ARREST_REPORT");
  const tickets = result.Record.filter((v) => v.type === "TICKET");

  const isDisabled =
    arrestReports.length <= 0 && tickets.length <= 0 && result.warrants.length <= 0;

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostExpungementRequestByCitizenIdData>({
      path: `/expungement-requests/${result.id}`,
      data: Object.entries(values).reduce(
        (ac, [key, data]) => ({
          ...ac,
          [key]: data,
        }),
        {},
      ),
      method: "POST",
    });

    if (json.id) {
      handleClose();
      onSuccess(json);
    }
  }

  const INITIAL_VALUES = {
    warrants: [] as string[],
    tickets: [] as string[],
    arrestReports: [] as string[],
    description: "",
  };

  const hasWarrants = result.warrants.length > 0;
  const hasTickets = tickets.length > 0;
  const hasArrestReports = arrestReports.length > 0;

  return (
    <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
      {({ setFieldValue, values, errors, isValid }) => (
        <Form>
          {hasWarrants ? (
            <SelectField
              errorMessage={errors.warrants}
              label={leo("warrants")}
              selectionMode="multiple"
              selectedKeys={values.warrants}
              onSelectionChange={(keys) => setFieldValue("warrants", keys)}
              options={result.warrants.map((v) => ({
                value: v.id,
                label: v.description,
              }))}
            />
          ) : (
            <section className="mb-3">
              <h4 className="font-medium text-lg">{leo("warrants")}</h4>
              <p className="text-base my-1">{leo("noWarrants")}</p>
            </section>
          )}

          {hasArrestReports ? (
            <SelectField
              errorMessage={errors.arrestReports}
              label={leo("arrestReports")}
              selectionMode="multiple"
              selectedKeys={values.arrestReports}
              onSelectionChange={(keys) => setFieldValue("arrestReports", keys)}
              options={arrestReports.map((v) => ({
                value: v.id,
                label: getTitles(v),
              }))}
            />
          ) : (
            <section className="mb-3">
              <h4 className="font-medium text-lg">{leo("arrestReports")}</h4>
              <p className="text-base my-1">{leo("noArrestReports")}</p>
            </section>
          )}

          {hasTickets ? (
            <SelectField
              errorMessage={errors.tickets}
              label={leo("tickets")}
              selectionMode="multiple"
              selectedKeys={values.tickets}
              onSelectionChange={(keys) => setFieldValue("tickets", keys)}
              options={tickets.map((v) => ({
                value: v.id,
                label: getTitles(v),
              }))}
            />
          ) : (
            <section className="mb-3">
              <h4 className="font-medium text-lg">{leo("tickets")}</h4>
              <p className="text-base my-1">{leo("noTicketsCitizen")}</p>
            </section>
          )}

          <TextField
            isOptional
            isTextarea
            errorMessage={errors.description}
            value={values.description}
            onChange={(value) => setFieldValue("description", value)}
            label={common("description")}
          />

          <footer className="flex justify-end mt-5">
            <Button onPress={handleClose} variant="cancel" type="reset">
              {common("cancel")}
            </Button>
            <Button
              className="flex items-center"
              disabled={isDisabled || !isValid || state === "loading"}
              type="submit"
            >
              {state === "loading" ? <Loader className="mr-2" /> : null}
              {t("request")}
            </Button>
          </footer>
        </Form>
      )}
    </Formik>
  );
}

export function getTitles(
  record: GetManageExpungementRequests["pendingExpungementRequests"][number]["records"][number],
) {
  const titles = record.violations.map((v) => v.penalCode?.title).filter(Boolean) as string[];
  return titles.join(", ");
}
