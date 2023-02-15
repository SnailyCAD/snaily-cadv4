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
import { toastMessage } from "lib/toastMessage";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { PostRecordsData, PutRecordsByIdData } from "@snailycad/types/api";
import { Toggle } from "components/form/Toggle";
import { AddressPostalSelect } from "components/form/select/PostalSelect";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import { ManageCourtEntry } from "components/courthouse/court-entries/manage-court-entry-modal";
import { FullDate } from "components/shared/FullDate";
import { TabList, TabsContent } from "components/shared/TabList";
import { SeizedItemsTab } from "./tabs/seized-items-tab/seized-items-tab";
import { ViolationsTab } from "./tabs/violations-tab/violations-tab";
import { VehicleTab } from "./tabs/vehicle-tab/vehicle-tab";

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
  const { isOpen, closeModal, openModal, getPayload } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const tCourt = useTranslations("Courthouse");
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
            fine: { enabled: !!v.fine, value: v.fine ?? undefined },
            counts: { enabled: true, value: v.counts ?? undefined },
            jailTime: { enabled: !!v.jailTime, value: v.jailTime ?? undefined },
            bail: { enabled: LEO_BAIL ? !!v.jailTime : false, value: v.bail ?? undefined },
          },
        };
      }) ?? ([] as SelectValue<PenalCode>[]),
    address: props.record?.address ?? "",
    postal: props.record?.postal ?? "",
    notes: props.record?.notes ?? "",
    seizedItems: props.record?.seizedItems ?? [],
    paymentStatus: props.record?.paymentStatus ?? null,
    courtEntry: props.record?.courtEntry ?? null,

    plateOrVin: props.record?.vehicle?.plate ?? props.record?.vehiclePlate ?? "",
    plateOrVinSearch: props.record?.vehicle?.plate ?? props.record?.vehiclePlate ?? "",
    vehicleId: props.record?.vehicleId ?? null,
    vehicleModel: props.record?.vehicle?.model.value.value ?? props.record?.vehicleModel ?? null,
    vehicleColor: props.record?.vehicle?.color ?? props.record?.vehicleColor ?? null,
  };

  return (
    <Modal
      title={t(data[props.type].title)}
      onClose={handleClose}
      isOpen={isOpen(data[props.type].id)}
      className="w-[800px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setFieldValue, errors, values, isValid }) => (
          <Form autoComplete="off">
            <TabList
              tabs={[
                { name: "General Information", value: "general-information-tab" },
                { name: "Violations", value: "violations-tab" },
                { name: "Seized Items", value: "seized-items-tab" },
                { name: "Vehicle Tab", value: "vehicle-tab" },
              ]}
            >
              <TabsContent value="general-information-tab">
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

                <AddressPostalSelect isDisabled={props.isReadOnly} postalOptional={false} />

                {/* todo: custom component for this */}
                <FormField className="relative mt-3 mb-2" label={tCourt("courtEntries")}>
                  <Button
                    className="absolute right-0 top-0"
                    type="button"
                    onPress={() => openModal(ModalIds.ManageCourtEntry)}
                  >
                    {tCourt("manageCourtEntry")}
                  </Button>

                  {values.courtEntry?.dates
                    ? values.courtEntry.dates.map((date, idx) => (
                        <FullDate onlyDate key={idx}>
                          {date.date}
                        </FullDate>
                      ))
                    : "None"}
                </FormField>

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
              </TabsContent>

              <SeizedItemsTab isReadOnly={props.isReadOnly} />
              <ViolationsTab penalCodes={penalCodes} isReadOnly={props.isReadOnly} />
              <VehicleTab isReadOnly={props.isReadOnly} />
            </TabList>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              {props.isReadOnly ? null : (
                <Button
                  className="flex items-center"
                  disabled={!isValid || state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {props.record ? common("save") : common("create")}
                </Button>
              )}
            </footer>

            <ManageCourtEntry
              submitHandler={(values) => {
                closeModal(ModalIds.ManageCourtEntry);
                setFieldValue("courtEntry", values);
              }}
              courtEntry={values.courtEntry}
            />
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
