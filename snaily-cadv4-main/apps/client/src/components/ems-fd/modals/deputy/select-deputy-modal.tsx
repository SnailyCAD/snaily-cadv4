import { SELECT_DEPUTY_SCHEMA } from "@snailycad/schemas";
import { Loader, Button, AsyncListSearchField, Item, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, type FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { useEmsFdState } from "state/ems-fd-state";
import { useValues } from "context/ValuesContext";
import { type EmsFdDeputy, ShouldDoType, WhatPages } from "@snailycad/types";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import type { GetMyDeputiesData, PutDispatchStatusByUnitId } from "@snailycad/types/api";
import type { EmergencyVehicleValue } from "@snailycad/types";
import { Permissions, usePermission } from "hooks/usePermission";
import { handleWhatPagesFilter } from "components/shared/utility-panel/statuses-area";

export function SelectDeputyModal() {
  const setActiveDeputy = useEmsFdState((state) => state.setActiveDeputy);

  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();

  const { state, execute } = useFetch();

  const { codes10 } = useValues();
  const onDutyCode = codes10.values.find(
    (v) => v.shouldDo === ShouldDoType.SET_ON_DUTY && handleWhatPagesFilter(v, WhatPages.EMS_FD),
  );

  const { hasPermissions } = usePermission();
  const canSetUserDefinedCallsign = hasPermissions([Permissions.SetUserDefinedCallsignOnEmsFd]);

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!onDutyCode) return;

    const { json } = await execute<PutDispatchStatusByUnitId, typeof INITIAL_VALUES>({
      path: `/dispatch/status/${values.deputyId}`,
      method: "PUT",
      data: {
        vehicleId: values.vehicleId,
        status: onDutyCode.id,
        userDefinedCallsign: canSetUserDefinedCallsign ? values.userDefinedCallsign : undefined,
      },
      helpers,
    });

    if (json.id) {
      modalState.closeModal(ModalIds.SelectDeputy);
      setActiveDeputy(json as EmsFdDeputy);
    }
  }

  const validate = handleValidate(SELECT_DEPUTY_SCHEMA);
  const INITIAL_VALUES = {
    deputyId: "",
    deputy: null as EmsFdDeputy | null,
    deputySearch: "",
    vehicleId: null as string | null,
    vehicleSearch: "",
    userDefinedCallsign: canSetUserDefinedCallsign ? "" : undefined,
  };

  return (
    <Modal
      title={t("Ems.selectDeputy")}
      onClose={() => modalState.closeModal(ModalIds.SelectDeputy)}
      isOpen={modalState.isOpen(ModalIds.SelectDeputy)}
      className="w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setValues, setFieldValue, errors, values, isValid }) => {
          return (
            <Form>
              <AsyncListSearchField<GetMyDeputiesData["deputies"][number]>
                allowsCustomValue
                errorMessage={errors.deputyId}
                label={t("Ems.deputy")}
                localValue={values.deputySearch}
                onInputChange={(value) => setFieldValue("deputySearch", value)}
                onSelectionChange={(node) => {
                  if (node) {
                    setValues({
                      ...values,
                      deputySearch: node.textValue,
                      deputyId: node.key as string,
                      deputy: node.value ?? null,
                    });
                  }
                }}
                fetchOptions={{
                  apiPath: (query) => `/ems-fd?query=${query}`,
                  onResponse(json: GetMyDeputiesData) {
                    return json.deputies;
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
                errorMessage={errors.vehicleId}
                isOptional
                label={t("Ems.emergencyVehicle")}
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
                    `/admin/values/emergency_vehicle/search?query=${query}&department=${values.deputy?.departmentId}`,
                  filterTextRequired: true,
                }}
              >
                {(item) => <Item key={item.id}>{item.value.value}</Item>}
              </AsyncListSearchField>

              {canSetUserDefinedCallsign ? (
                <TextField
                  isOptional
                  label={t("Leo.userDefinedCallsign")}
                  value={values.userDefinedCallsign}
                  onChange={(value) => setFieldValue("userDefinedCallsign", value)}
                  description={t("Leo.userDefinedCallsignDescription")}
                />
              ) : null}

              <footer className="flex justify-end mt-5">
                <Button
                  type="reset"
                  onPress={() => modalState.closeModal(ModalIds.SelectDeputy)}
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
