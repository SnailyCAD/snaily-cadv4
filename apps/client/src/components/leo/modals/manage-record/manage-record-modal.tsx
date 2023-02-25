import * as React from "react";
import { CREATE_TICKET_SCHEMA, CREATE_TICKET_SCHEMA_BUSINESS } from "@snailycad/schemas";
import {
  Loader,
  Button,
  TextField,
  AsyncListSearchField,
  Item,
  TabList,
  TabsContent,
} from "@snailycad/ui";
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
import { FullDate } from "components/shared/FullDate";

import dynamic from "next/dynamic";
import { FormRow } from "components/form/FormRow";
import type { BusinessSearchResult } from "state/search/business-search-state";

const ManageCourtEntryModal = dynamic(
  async () =>
    (await import("components/courthouse/court-entries/manage-court-entry-modal")).ManageCourtEntry,
  { ssr: false },
);

const VehicleTab = dynamic(
  async () => (await import("./tabs/vehicle-tab/vehicle-tab")).VehicleTab,
  { ssr: false },
);

const SeizedItemsTab = dynamic(
  async () => (await import("./tabs/seized-items-tab/seized-items-tab")).SeizedItemsTab,
  { ssr: false, loading: () => <Loader /> },
);

const ViolationsTab = dynamic(
  async () => (await import("./tabs/violations-tab/violations-tab")).ViolationsTab,
  { loading: () => <Loader /> },
);

const ConnectionsTab = dynamic(
  async () => (await import("./tabs/connections-tab/connections-tab")).ConnectionsTab,
  { ssr: false, loading: () => <Loader /> },
);

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
  const [isBusinessRecord, setIsBusinessRecord] = React.useState(!!props.record?.businessId);
  const { isOpen, closeModal, openModal, getPayload } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const tCourt = useTranslations("Courthouse");
  const { LEO_BAIL } = useFeatureEnabled();

  React.useEffect(() => {
    setIsBusinessRecord(!!props.record?.businessId);
  }, [props.record?.businessId]);

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
      ? penalCode.values.filter((v) => v.warningApplicableId !== null)
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
        const name = isBusinessRecord ? values.businessName : values.citizenName;

        toastMessage({
          title: common("success"),
          message: t(data[props.type].success, { citizen: name }),
          icon: "success",
        });

        props.onCreate?.(json);
        handleClose();
      }
    }
  }

  const payload = getPayload<{
    citizenId?: string;
    citizenName?: string;
    businessId?: string;
    businessName?: string;
  }>(data[props.type].id);
  const schema = isBusinessRecord ? CREATE_TICKET_SCHEMA_BUSINESS : CREATE_TICKET_SCHEMA;
  const validate = handleValidate(schema);

  const INITIAL_VALUES = {
    type: props.type,
    citizenId: props.record?.citizenId ?? payload?.citizenId ?? "",
    citizenName: payload?.citizenName ?? "",

    businessId: props.record?.businessId ?? payload?.businessId ?? "",
    businessName: payload?.businessName ?? "",

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

    call911Id: props.record?.call911Id ?? null,
    incidentId: props.record?.incidentId ?? null,
  };

  return (
    <Modal
      title={t(data[props.type].title)}
      onClose={handleClose}
      isOpen={isOpen(data[props.type].id)}
      className="w-[800px]"
    >
      <Formik
        enableReinitialize
        validate={validate}
        initialValues={INITIAL_VALUES}
        onSubmit={onSubmit}
      >
        {({ setFieldValue, setValues, errors, values, isValid }) => (
          <Form autoComplete="off">
            <TabList
              tabs={[
                { name: "General Information", value: "general-information-tab" },
                { name: "Violations", value: "violations-tab" },
                { name: "Seized Items", value: "seized-items-tab" },
                { name: "Vehicle Information", value: "vehicle-tab" },
                { name: "Connections", value: "connections-tab" },
              ]}
            >
              <TabsContent value="general-information-tab">
                {props.hideCitizenField ? null : (
                  <FormRow flexLike>
                    {isBusinessRecord ? (
                      <AsyncListSearchField<BusinessSearchResult>
                        className="w-full"
                        autoFocus
                        isDisabled={props.isReadOnly || !!props.record}
                        setValues={({ localValue, node }) => {
                          const labelValue =
                            typeof localValue !== "undefined" ? { businessName: localValue } : {};
                          const valueField = node ? { businessId: node.key as string } : {};

                          setValues({ ...values, ...labelValue, ...valueField });
                        }}
                        localValue={values.businessName}
                        errorMessage={errors.businessId}
                        label={t("business")}
                        selectedKey={values.businessId}
                        fetchOptions={{
                          apiPath: "/search/business",
                          method: "POST",
                          bodyKey: "name",
                          filterTextRequired: true,
                        }}
                      >
                        {(item) => (
                          <Item key={item.id} textValue={item.name}>
                            {item.name}
                          </Item>
                        )}
                      </AsyncListSearchField>
                    ) : (
                      <CitizenSuggestionsField
                        autoFocus
                        fromAuthUserOnly={false}
                        label={t("citizen")}
                        isDisabled={props.isReadOnly || !!props.record}
                        labelFieldName="citizenName"
                        valueFieldName="citizenId"
                      />
                    )}
                    <Button
                      isDisabled={props.isReadOnly || !!props.record}
                      onPress={() => setIsBusinessRecord((prev) => !prev)}
                      className="min-w-fit h-[39px] mt-7"
                    >
                      {isBusinessRecord ? t("citizenRecord") : t("businessRecord")}
                    </Button>
                  </FormRow>
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
              <ConnectionsTab record={props.record} isReadOnly={props.isReadOnly} />
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

            <ManageCourtEntryModal
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
