import { SELECT_OFFICER_SCHEMA } from "@snailycad/schemas";
import { Loader, Button, AsyncListSearchField, Item, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, type FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { useLeoState } from "state/leo-state";
import { useValues } from "context/ValuesContext";
import {
  type EmergencyVehicleValue,
  type Officer,
  ShouldDoType,
  WhatPages,
  ValueType,
} from "@snailycad/types";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import type { GetMyOfficersData, PutDispatchStatusByUnitId } from "@snailycad/types/api";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { Permissions, usePermission } from "hooks/usePermission";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { handleWhatPagesFilter } from "components/shared/utility-panel/statuses-area";

export function SelectOfficerModal() {
  const setActiveOfficer = useLeoState((state) => state.setActiveOfficer);

  const { activeOfficers, setActiveOfficers } = useDispatchState((state) => ({
    activeOfficers: state.activeOfficers,
    setActiveOfficers: state.setActiveOfficers,
  }));

  const modalState = useModal();
  const common = useTranslations("Common");
  const error = useTranslations("Errors");
  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();

  const payload = modalState.getPayload<{ includeStatuses: boolean }>(ModalIds.SelectOfficer);
  const includeStatuses = payload?.includeStatuses ?? false;

  const { codes10 } = useValues();
  const onDutyCode = codes10.values.find(
    (v) => v.shouldDo === ShouldDoType.SET_ON_DUTY && handleWhatPagesFilter(v, WhatPages.LEO),
  );
  const { state, execute } = useFetch();

  const { hasPermissions } = usePermission();
  const canSetUserDefinedCallsign = hasPermissions([Permissions.SetUserDefinedCallsignOnOfficer]);

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!onDutyCode) return;

    const { json } = await execute<PutDispatchStatusByUnitId, typeof INITIAL_VALUES>({
      path: `/dispatch/status/${values.officerId}`,
      method: "PUT",
      data: {
        status: includeStatuses ? values.status : onDutyCode.id,
        vehicleId: values.vehicleId,
        userDefinedCallsign: canSetUserDefinedCallsign ? values.userDefinedCallsign : undefined,
      },
      helpers,
    });

    if (json.id) {
      modalState.closeModal(ModalIds.SelectOfficer);
      setActiveOfficer(json as Officer);

      const isUnitInActiveUnits = activeOfficers.some((o) => o.id === json.id);

      if (!isUnitInActiveUnits) {
        setActiveOfficers([json as Officer, ...activeOfficers]);
      }
    }
  }

  const validate = handleValidate(SELECT_OFFICER_SCHEMA);
  const INITIAL_VALUES = {
    officerId: "",
    officer: null as Officer | null,
    officerSearch: "",
    status: null,
    vehicleId: null as string | null,
    vehicleSearch: "",
    userDefinedCallsign: canSetUserDefinedCallsign ? "" : undefined,
  };

  return (
    <Modal
      title={t("selectOfficer")}
      onClose={() => modalState.closeModal(ModalIds.SelectOfficer)}
      isOpen={modalState.isOpen(ModalIds.SelectOfficer)}
      className="w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setValues, setFieldValue, errors, values, isValid }) => {
          return (
            <Form>
              {includeStatuses ? (
                <p className="my-3 text-neutral-700 dark:text-gray-400">
                  {error("noActiveOfficer")}
                </p>
              ) : null}

              <AsyncListSearchField<GetMyOfficersData["officers"][number]>
                allowsCustomValue
                errorMessage={errors.officerId}
                label={t("officer")}
                localValue={values.officerSearch}
                onInputChange={(value) => setFieldValue("officerSearch", value)}
                onSelectionChange={(node) => {
                  if (node) {
                    setValues({
                      ...values,
                      officerSearch: node.textValue,
                      officerId: node.key as string,
                      officer: node.value ?? null,
                    });
                  }
                }}
                fetchOptions={{
                  apiPath: (query) => `/leo?query=${query}`,
                  onResponse(json: GetMyOfficersData) {
                    return json.officers;
                  },
                }}
              >
                {(item) => {
                  const formattedName = `${generateCallsign(item)} ${makeUnitName(item)}`;

                  return (
                    <Item key={item.id} textValue={formattedName}>
                      {formattedName}
                    </Item>
                  );
                }}
              </AsyncListSearchField>

              <AsyncListSearchField<EmergencyVehicleValue>
                isClearable
                errorMessage={errors.vehicleId}
                isOptional
                label={t("patrolVehicle")}
                localValue={values.vehicleSearch}
                onInputChange={(value) => setFieldValue("vehicleSearch", value)}
                onSelectionChange={(node) => {
                  if (node) {
                    setValues({
                      ...values,
                      vehicleSearch: node.value?.value.value ?? node.textValue,
                      vehicleId: node.key as string,
                    });
                  }
                }}
                fetchOptions={{
                  apiPath: (query) =>
                    `/admin/values/emergency_vehicle/search?query=${query}&department=${values.officer?.departmentId}`,
                  filterTextRequired: true,
                }}
              >
                {(item) => <Item key={item.id}>{item.value.value}</Item>}
              </AsyncListSearchField>

              {includeStatuses ? (
                <ValueSelectField
                  label={t("status")}
                  fieldName="status"
                  valueType={ValueType.CODES_10}
                  values={codes10.values}
                  isClearable
                  filterFn={(value) =>
                    value.shouldDo !== "SET_OFF_DUTY" && value.type === "STATUS_CODE"
                  }
                />
              ) : null}

              {canSetUserDefinedCallsign ? (
                <TextField
                  isOptional
                  label={t("userDefinedCallsign")}
                  value={values.userDefinedCallsign}
                  onChange={(value) => setFieldValue("userDefinedCallsign", value)}
                  description={t("userDefinedCallsignDescription")}
                />
              ) : null}

              <footer className="flex justify-end mt-5">
                <Button
                  type="reset"
                  onPress={() => modalState.closeModal(ModalIds.SelectOfficer)}
                  variant="cancel"
                >
                  {common("cancel")}
                </Button>
                <Button
                  className="flex items-center"
                  disabled={!isValid || state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {common("save")}
                </Button>
              </footer>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
}
