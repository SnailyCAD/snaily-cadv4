import { CREATE_TICKET_SCHEMA } from "@snailycad/schemas";
import { Loader, Button, TextField } from "@snailycad/ui";
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
import { RecordType, type PenalCode, type Record, PaymentStatus } from "@snailycad/types";
import { PenalCodesTable } from "./ManageRecord/PenalCodesTable";
import { SelectPenalCode } from "./ManageRecord/SelectPenalCode";
import { SeizedItemsTable } from "./ManageRecord/seized-items/SeizedItemsTable";
import { toastMessage } from "lib/toastMessage";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { PostRecordsData, PutRecordsByIdData } from "@snailycad/types/api";
import { Toggle } from "components/form/Toggle";
import { AddressPostalSelect } from "components/form/select/PostalSelect";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";

interface Props {
  hideCitizenField?: boolean;
  record?: Record | null;
  type: RecordType;
  id?:
    | ModalIds.ManageRecord
    | ModalIds.CreateTicket
    | ModalIds.CreateArrestReport
    | ModalIds.CreateWrittenWarning;
  isEdit?: boolean;
  isReadOnly?: boolean;
  onUpdate?(data: Record): void;
  onCreate?(data: Record): void;
  customSubmitHandler?(data: any): Awaited<boolean>;
  onClose?(): void;
}

export function ManageRecordModal(props: Props) {
  const { isOpen, closeModal, getPayload } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { LEO_BAIL } = useFeatureEnabled();

  const data = {
    [RecordType.TICKET]: {
      isEdit: props.isEdit,
      title: props.isEdit ? "editTicket" : "createTicket",
      id: props.id ?? ModalIds.CreateTicket,
      success: "successCreateTicket",
    },
    [RecordType.ARREST_REPORT]: {
      isEdit: props.isEdit,
      title: props.isEdit ? "editArrestReport" : "createArrestReport",
      id: props.id ?? ModalIds.CreateArrestReport,
      success: "successCreateArrestReport",
    },
    [RecordType.WRITTEN_WARNING]: {
      isEdit: props.isEdit,
      title: props.isEdit ? "editWrittenWarning" : "createWrittenWarning",
      id: props.id ?? ModalIds.CreateWrittenWarning,
      success: "successCreateWarning",
    },
  };

  const { state, execute } = useFetch();
  const { penalCode } = useValues();
  const penalCodes =
    props.type === "WRITTEN_WARNING"
      ? penalCode.values.filter(
          (v) => v.warningApplicableId !== null && v.warningNotApplicableId === null,
        )
      : penalCode.values;

  function handleClose() {
    props.onClose?.();
    closeModal(data[props.type].id);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (props.isReadOnly) return;

    const requestData = {
      ...values,
      type: props.type,
      violations: values.violations.map(({ value }: { value: any }) => ({
        penalCodeId: value.id,
        bail: LEO_BAIL && value.jailTime?.enabled ? value.bail?.value : null,
        jailTime: value.jailTime?.enabled ? value.jailTime?.value : null,
        fine: value.fine?.enabled ? value.fine?.value : null,
        counts: value.counts?.value ?? null,
      })),
    };

    validateRecords(values.violations, helpers);

    if (props.customSubmitHandler) {
      const closable = await props.customSubmitHandler({ ...requestData, id: props.record?.id });
      if (closable) {
        handleClose();
      }
      return;
    }

    if (props.record) {
      const { json } = await execute<PutRecordsByIdData, typeof INITIAL_VALUES>({
        path: `/records/record/${props.record.id}`,
        method: "PUT",
        data: requestData,
        helpers,
      });

      if (json.id) {
        props.onUpdate?.(json);
        handleClose();
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
          message: t(data[props.type].success, { citizen: values.citizenName }),
          icon: "success",
        });

        props.onCreate?.(json);
        handleClose();
      }
    }
  }

  const payload = getPayload<{ citizenId: string; citizenName: string }>(data[props.type].id);
  const validate = handleValidate(CREATE_TICKET_SCHEMA);

  const INITIAL_VALUES = {
    type: props.type,
    citizenId: props.record?.citizenId ?? payload?.citizenId ?? "",
    citizenName: payload?.citizenName ?? "",
    violations:
      props.record?.violations.map((v) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const penalCode = v.penalCode ?? penalCodes.find((p) => p.id === v.penalCodeId);

        return {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          label: penalCode?.title,
          value: {
            key: v.penalCodeId,
            ...penalCode,
            fine: { enabled: !!v.fine, value: v.fine },
            counts: { enabled: true, value: v.counts },
            jailTime: { enabled: !!v.jailTime, value: v.jailTime },
            bail: { enabled: LEO_BAIL ? !!v.jailTime : false, value: v.bail },
          },
        };
      }) ?? ([] as SelectValue<PenalCode>[]),
    postal: props.record?.postal ?? "",
    notes: props.record?.notes ?? "",
    seizedItems: props.record?.seizedItems ?? [],
    paymentStatus: props.record?.paymentStatus ?? null,
  };

  return (
    <Modal
      title={t(data[props.type].title)}
      onClose={handleClose}
      isOpen={isOpen(data[props.type].id)}
      className="w-[800px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form autoComplete="off">
            {props.hideCitizenField ? null : (
              <CitizenSuggestionsField
                autoFocus
                fromAuthUserOnly={false}
                label={t("citizen")}
                isDisabled={props.isReadOnly || !!props.record}
                labelFieldName="citizenName"
                valueFieldName="citizenId"
              />
            )}

            <AddressPostalSelect postalOptional={false} postalOnly />

            <FormField label={t("violations")}>
              <SelectPenalCode
                isReadOnly={props.isReadOnly}
                penalCodes={penalCodes}
                value={values.violations}
                handleChange={handleChange}
              />
            </FormField>

            <PenalCodesTable
              isReadOnly={props.isReadOnly}
              penalCodes={values.violations.map((v) => v.value)}
            />
            <SeizedItemsTable isReadOnly={props.isReadOnly} />

            <TextField
              isTextarea
              isOptional
              isDisabled={props.isReadOnly}
              errorMessage={errors.notes}
              label={t("notes")}
              value={values.notes}
              name="notes"
              onChange={(value) => setFieldValue("notes", value)}
            />

            <FormField optional errorMessage={errors.paymentStatus} label={t("recordPaid")}>
              <Toggle
                disabled={props.isReadOnly}
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
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={props.isReadOnly || !isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {props.record ? common("save") : common("create")}
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
