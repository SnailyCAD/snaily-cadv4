import * as React from "react";
import { CREATE_TICKET_SCHEMA } from "@snailycad/schemas";
import { Textarea, Loader, Button, TextField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import type { SelectValue } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik, type FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import {
  type Citizen,
  RecordType,
  type PenalCode,
  type Record,
  PaymentStatus,
} from "@snailycad/types";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { PersonFill } from "react-bootstrap-icons";
import { useImageUrl } from "hooks/useImageUrl";
import { PenalCodesTable } from "./ManageRecord/PenalCodesTable";
import { SelectPenalCode } from "./ManageRecord/SelectPenalCode";
import { SeizedItemsTable } from "./ManageRecord/seized-items/SeizedItemsTable";
import { toastMessage } from "lib/toastMessage";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { PostRecordsData, PutRecordsByIdData } from "@snailycad/types/api";
import Image from "next/future/image";
import { Toggle } from "components/form/Toggle";

interface Props {
  record?: Record | null;
  type: RecordType;
  id?: ModalIds.ManageRecord | ModalIds.CreateTicket;
  isEdit?: boolean;
  isReadOnly?: boolean;
  onUpdate?(data: Record): void;
  onCreate?(data: Record): void;
}

export function ManageRecordModal({
  onUpdate,
  onCreate,
  isReadOnly,
  record,
  type,
  isEdit,
  id,
}: Props) {
  const { isOpen, closeModal, getPayload } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { LEO_BAIL } = useFeatureEnabled();

  const data = {
    [RecordType.TICKET]: {
      isEdit,
      title: isEdit ? "editTicket" : "createTicket",
      id: id ?? ModalIds.CreateTicket,
      success: "successCreateTicket",
    },
    [RecordType.ARREST_REPORT]: {
      isEdit,
      title: isEdit ? "editArrestReport" : "createArrestReport",
      id: id ?? ModalIds.CreateArrestReport,
      success: "successCreateArrestReport",
    },
    [RecordType.WRITTEN_WARNING]: {
      isEdit,
      title: isEdit ? "editWrittenWarning" : "createWrittenWarning",
      id: id ?? ModalIds.CreateWrittenWarning,
      success: "successCreateWarning",
    },
  };

  const { state, execute } = useFetch();
  const { penalCode } = useValues();
  const { makeImageUrl } = useImageUrl();
  const penalCodes =
    type === "WRITTEN_WARNING"
      ? penalCode.values.filter(
          (v) => v.warningApplicableId !== null && v.warningNotApplicableId === null,
        )
      : penalCode.values;

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (isReadOnly) return;

    const requestData = {
      ...values,
      type,
      violations: values.violations.map(({ value }: { value: any }) => ({
        penalCodeId: value.id,
        bail: LEO_BAIL && value.jailTime?.enabled ? value.bail?.value : null,
        jailTime: value.jailTime?.enabled ? value.jailTime?.value : null,
        fine: value.fine?.enabled ? value.fine?.value : null,
      })),
    };

    validateRecords(values.violations, helpers);

    if (record) {
      const { json } = await execute<PutRecordsByIdData, typeof INITIAL_VALUES>({
        path: `/records/record/${record.id}`,
        method: "PUT",
        data: requestData,
        helpers,
      });

      if (json.id) {
        onUpdate?.(json);
        closeModal(data[type].id);
      }
    } else {
      const { json } = await execute<PostRecordsData, typeof INITIAL_VALUES>({
        path: "/records",
        method: "POST",
        data: requestData,
        helpers,
      });

      if (json.id) {
        toastMessage({
          title: common("success"),
          message: t(data[type].success, { citizen: values.citizenName }),
          icon: "success",
        });

        onCreate?.(json);
        closeModal(data[type].id);
      }
    }
  }

  const payload = getPayload<{ citizenId: string; citizenName: string }>(data[type].id);
  const validate = handleValidate(CREATE_TICKET_SCHEMA);

  const INITIAL_VALUES = {
    type,
    citizenId: record?.citizenId ?? payload?.citizenId ?? "",
    citizenName: payload?.citizenName ?? "",
    violations:
      record?.violations.map((v) => ({
        label: v.penalCode.title,
        value: {
          key: v.penalCodeId,
          ...v.penalCode,
          fine: { enabled: !!v.fine, value: v.fine },
          jailTime: { enabled: !!v.jailTime, value: v.jailTime },
          bail: { enabled: LEO_BAIL ? !!v.jailTime : false, value: v.bail },
        },
      })) ?? ([] as SelectValue<PenalCode>[]),
    postal: record?.postal ?? "",
    notes: record?.notes ?? "",
    seizedItems: record?.seizedItems ?? [],
    paymentStatus: record?.paymentStatus ?? null,
  };

  return (
    <Modal
      title={t(data[type].title)}
      onClose={() => closeModal(data[type].id)}
      isOpen={isOpen(data[type].id)}
      className="w-[800px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setValues, setFieldValue, errors, values, isValid }) => (
          <Form autoComplete="off">
            <FormField errorMessage={errors.citizenId} label={t("citizen")}>
              <InputSuggestions<Citizen>
                inputProps={{
                  value: values.citizenName,
                  name: "citizenName",
                  onChange: handleChange,
                  disabled: isReadOnly || !!record,
                  errorMessage: errors.citizenName,
                }}
                onSuggestionPress={(suggestion) => {
                  const newValues = {
                    ...values,
                    citizenId: suggestion.id,
                    citizenName: `${suggestion.name} ${suggestion.surname}`,
                  };

                  setValues(newValues, true);
                }}
                options={{
                  apiPath: "/search/name",
                  dataKey: "name",
                  method: "POST",
                }}
                Component={({ suggestion }) => (
                  <div className="flex items-center">
                    <div className="mr-2 min-w-[25px]">
                      {suggestion.imageId ? (
                        <Image
                          className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                          draggable={false}
                          src={makeImageUrl("citizens", suggestion.imageId)!}
                          loading="lazy"
                          width={30}
                          height={30}
                          alt={`${suggestion.name} ${suggestion.surname}`}
                        />
                      ) : (
                        <PersonFill className="text-gray-500/60 w-[25px] h-[25px]" />
                      )}
                    </div>
                    <p>
                      {suggestion.name} {suggestion.surname}
                    </p>
                  </div>
                )}
              />
            </FormField>

            <TextField
              name="postal"
              label={t("postal")}
              isDisabled={isReadOnly}
              errorMessage={errors.postal}
              onChange={(value) => setFieldValue("postal", value)}
            />

            <FormField label={t("violations")}>
              <SelectPenalCode
                isReadOnly={isReadOnly}
                penalCodes={penalCodes}
                value={values.violations}
                handleChange={handleChange}
              />
            </FormField>

            <PenalCodesTable
              isReadOnly={isReadOnly}
              penalCodes={values.violations.map((v) => v.value)}
            />
            <SeizedItemsTable isReadOnly={isReadOnly} />

            <FormField optional errorMessage={errors.notes} label={t("notes")}>
              <Textarea
                disabled={isReadOnly}
                value={values.notes}
                name="notes"
                onChange={handleChange}
              />
            </FormField>

            <FormField optional errorMessage={errors.paymentStatus} label={t("recordPaid")}>
              <Toggle
                disabled={isReadOnly}
                value={values.paymentStatus === PaymentStatus.PAID}
                name="paymentStatus"
                onCheckedChange={(event) => {
                  setFieldValue(
                    "paymentStatus",
                    event.target.value ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                  );
                }}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={() => closeModal(data[type].id)} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={isReadOnly || !isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {record ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}

function validateRecords(data: any[], helpers: FormikHelpers<any>) {
  data.forEach(({ value }) => {
    const isFinesEnabled = value.fine?.enabled;
    const fine = value.fine?.value;
    check(isFinesEnabled, fine, value.id, "fine");

    const isJailTimeEnabled = value.jailTime?.enabled;
    const jailTime = value.jailTime?.value;
    check(isJailTimeEnabled, jailTime, value.id, "jailTime");
  });

  function check(enabled: boolean, value: unknown, id: string, fieldName: "fine" | "jailTime") {
    if (enabled && !value) {
      throw helpers.setFieldError(
        `violations[${id}].${fieldName}`,
        "You must enter a value if field is enabled",
      );
    }
  }

  return true;
}
