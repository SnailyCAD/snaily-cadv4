import * as React from "react";
import { CREATE_TICKET_SCHEMA, CREATE_TICKET_SCHEMA_BUSINESS } from "@snailycad/schemas";
import {
  Loader,
  Button,
  AsyncListSearchField,
  Item,
  TabList,
  TabsContent,
  SwitchField,
  FormRow,
  FullDate,
} from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik, type FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { RecordType, type PenalCode, type Record, PaymentStatus } from "@snailycad/types";
import { toastMessage } from "lib/toastMessage";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { PostRecordsData, PutRecordsByIdData } from "@snailycad/types/api";
import { AddressPostalSelect } from "components/form/select/PostalSelect";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import dynamic from "next/dynamic";
import type { BusinessSearchResult } from "state/search/business-search-state";
import { Editor, dataToSlate } from "components/editor/editor";
import { useInvalidateQuery } from "hooks/use-invalidate-query";

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
  { ssr: false },
);

const ViolationsTab = dynamic(
  async () => (await import("./tabs/violations-tab/violations-tab")).ViolationsTab,
  { ssr: false },
);

const ConnectionsTab = dynamic(
  async () => (await import("./tabs/connections-tab/connections-tab")).ConnectionsTab,
  { ssr: false },
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

interface CreateInitialRecordValuesOptions {
  t: ReturnType<typeof useTranslations<"Leo">>;
  type: RecordType;
  record?: Record | null;
  penalCodes: PenalCode[];
  isLeoBailEnabled: boolean;
  payload: {
    citizenId?: string;
    citizenName?: string;
    businessId?: string;
    businessName?: string;
  } | null;
}

export function createInitialRecordValues(options: CreateInitialRecordValuesOptions) {
  return {
    type: options.type,
    citizenId: options.record?.citizenId ?? options.payload?.citizenId ?? "",
    citizenName: options.payload?.citizenName ?? "",

    businessId: options.record?.businessId ?? options.payload?.businessId ?? "",
    businessName: options.payload?.businessName ?? "",

    violations: (options.record?.violations ?? []).map((v) => {
      return {
        label: v.penalCode?.title ?? options.t("deletedPenalCode"),
        value: {
          ...v.penalCode,
          fine: { enabled: Boolean(v.fine), value: v.fine },
          counts: { enabled: true, value: v.counts },
          jailTime: { enabled: Boolean(v.jailTime), value: v.jailTime },
          communityService: { enabled: Boolean(v.communityService), value: v.communityService },
          bail: {
            enabled: options.isLeoBailEnabled ? Boolean(v.jailTime) : false,
            value: v.bail,
          },
        },
      };
    }),
    address: options.record?.address ?? "",
    postal: options.record?.postal ?? "",
    notes: options.record?.notes ?? "",
    descriptionData: dataToSlate({
      description: options.record?.notes,
      descriptionData: options.record?.descriptionData,
    }),
    seizedItems: options.record?.seizedItems ?? [],
    paymentStatus: options.record?.paymentStatus ?? null,
    courtEntry: options.record?.courtEntry ?? null,

    plateOrVin: options.record?.vehicle?.plate ?? options.record?.vehiclePlate ?? "",
    plateOrVinSearch: options.record?.vehicle?.plate ?? options.record?.vehiclePlate ?? "",
    vehicleId: options.record?.vehicleId ?? null,
    vehicleModel:
      options.record?.vehicle?.model.value.value ?? options.record?.vehicleModel ?? null,
    vehicleColor: options.record?.vehicle?.color ?? options.record?.vehicleColor ?? null,
    vehiclePaceType: options.record?.vehiclePaceType ?? null,
    vehicleSpeed: options.record?.vehicleSpeed ?? null,
    speedLimit: options.record?.speedLimit ?? null,

    call911Id: options.record?.call911Id ?? null,
    call911CaseNumber: options.record?.call911?.caseNumber
      ? `#${options.record.call911.caseNumber}`
      : null,
    incidentId: options.record?.incidentId ?? null,
  };
}

export function ManageRecordModal(props: Props) {
  const [isBusinessRecord, setIsBusinessRecord] = React.useState(
    Boolean(props.record?.businessId && !props.record.citizenId),
  );
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const tCourt = useTranslations("Courthouse");
  const { LEO_BAIL } = useFeatureEnabled();
  const { invalidateQuery } = useInvalidateQuery(["officer", "notifications"]);

  React.useEffect(() => {
    setIsBusinessRecord(Boolean(props.record?.businessId && !props.record.citizenId));
  }, [props.record?.businessId, props.record?.citizenId]);

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
    modalState.closeModal(data[props.type].id);
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
        communityService: value.communityService?.enabled ? value.communityService?.value : null,
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
        await invalidateQuery();
      }
    }
  }

  const payload = modalState.getPayload<{
    citizenId?: string;
    citizenName?: string;
    businessId?: string;
    businessName?: string;
  }>(data[props.type].id);
  const schema = isBusinessRecord ? CREATE_TICKET_SCHEMA_BUSINESS : CREATE_TICKET_SCHEMA;
  const validate = handleValidate(schema);

  const INITIAL_VALUES = createInitialRecordValues({
    t,
    type: props.type,
    record: props.record,
    penalCodes,
    isLeoBailEnabled: LEO_BAIL,
    payload,
  });

  return (
    <Modal
      title={t(data[props.type].title)}
      onClose={handleClose}
      isOpen={modalState.isOpen(data[props.type].id)}
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
              defaultValue="general-information-tab"
              queryState={false}
              tabs={[
                { name: t("generalInformation"), value: "general-information-tab" },
                { name: t("violations"), value: "violations-tab" },
                { name: t("seizedItems"), value: "seized-items-tab" },
                { name: t("vehicleInformation"), value: "vehicle-tab" },
                { name: t("connections"), value: "connections-tab" },
              ]}
            >
              <TabsContent value="general-information-tab">
                {props.hideCitizenField ? null : (
                  <FormRow useFlex>
                    {isBusinessRecord ? (
                      <AsyncListSearchField<BusinessSearchResult>
                        className="w-full"
                        autoFocus
                        isDisabled={props.isReadOnly || Boolean(props.record)}
                        onInputChange={(value) => setFieldValue("businessName", value)}
                        onSelectionChange={(node) => {
                          if (node) {
                            setValues({
                              ...values,
                              businessName: node.value?.name ?? node.textValue,
                              businessId: node.key as string,
                            });
                          }
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
                        isDisabled={props.isReadOnly || Boolean(props.record)}
                        labelFieldName="citizenName"
                        valueFieldName="citizenId"
                      />
                    )}
                    <Button
                      isDisabled={props.isReadOnly || Boolean(props.record)}
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
                    onPress={() => modalState.openModal(ModalIds.ManageCourtEntry)}
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

                <FormField optional label={t("notes")} errorMessage={errors.notes}>
                  <Editor
                    value={values.descriptionData}
                    onChange={(v) => setFieldValue("descriptionData", v)}
                  />
                </FormField>

                <SwitchField
                  isDisabled={props.isReadOnly}
                  isSelected={values.paymentStatus === PaymentStatus.PAID}
                  onChange={(isSelected) => {
                    setFieldValue(
                      "paymentStatus",
                      isSelected ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                    );
                  }}
                >
                  {t("recordPaid")}
                </SwitchField>
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
                modalState.closeModal(ModalIds.ManageCourtEntry);
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
