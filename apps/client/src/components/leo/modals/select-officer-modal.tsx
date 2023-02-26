import { SELECT_OFFICER_SCHEMA } from "@snailycad/schemas";
import { Loader, Button, AsyncListSearchField, Item } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { useLeoState } from "state/leo-state";
import { useValues } from "context/ValuesContext";
import { EmergencyVehicleValue, Officer, ShouldDoType } from "@snailycad/types";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { isUnitDisabled, makeUnitName } from "lib/utils";
import type { PutDispatchStatusByUnitId } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { useUserOfficers } from "hooks/leo/use-get-user-officers";

export function SelectOfficerModal() {
  const setActiveOfficer = useLeoState((state) => state.setActiveOfficer);
  const { userOfficers, isLoading } = useUserOfficers();

  const { activeOfficers, setActiveOfficers } = useDispatchState(
    (state) => ({
      activeOfficers: state.activeOfficers,
      setActiveOfficers: state.setActiveOfficers,
    }),
    shallow,
  );

  const { isOpen, closeModal, getPayload } = useModal();
  const common = useTranslations("Common");
  const error = useTranslations("Errors");
  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();

  const payload = getPayload<{ includeStatuses: boolean }>(ModalIds.SelectOfficer);
  const includeStatuses = payload?.includeStatuses ?? false;

  const { codes10 } = useValues();
  const onDutyCode = codes10.values.find((v) => v.shouldDo === ShouldDoType.SET_ON_DUTY);
  const { state, execute } = useFetch();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!onDutyCode) return;

    const officerId = values.officer?.id;
    const { json } = await execute<PutDispatchStatusByUnitId, typeof INITIAL_VALUES>({
      path: `/dispatch/status/${officerId}`,
      method: "PUT",
      data: {
        status: includeStatuses ? values.status : onDutyCode.id,
        vehicleId: values.vehicleId,
      },
      helpers,
    });

    if (json.id) {
      closeModal(ModalIds.SelectOfficer);
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
    status: null,
    vehicleId: null as string | null,
    vehicleSearch: "",
  };

  return (
    <Modal
      title={t("selectOfficer")}
      onClose={() => closeModal(ModalIds.SelectOfficer)}
      isOpen={isOpen(ModalIds.SelectOfficer)}
      className="w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setValues, errors, values, isValid }) => (
          <Form>
            {includeStatuses ? (
              <p className="my-3 text-neutral-700 dark:text-gray-400">{error("noActiveOfficer")}</p>
            ) : null}

            <FormField errorMessage={errors.officer} label={t("officer")}>
              <Select
                isLoading={isLoading}
                value={
                  values.officer
                    ? `${generateCallsign(values.officer)} ${makeUnitName(values.officer)}`
                    : null
                }
                name="officer"
                onChange={handleChange}
                isClearable
                values={userOfficers.map((officer) => ({
                  label: `${generateCallsign(officer)} ${makeUnitName(officer)}`,
                  value: officer,
                  isDisabled: isUnitDisabled(officer),
                }))}
              />
            </FormField>

            <AsyncListSearchField<EmergencyVehicleValue>
              isClearable
              errorMessage={errors.vehicleId}
              isOptional
              label={t("patrolVehicle")}
              localValue={values.vehicleSearch}
              setValues={({ localValue, node }) => {
                const vehicleId = !node ? {} : { vehicleId: node.key as string };
                const searchValue =
                  typeof localValue === "undefined" ? {} : { vehicleSearch: localValue };

                setValues({ ...values, ...vehicleId, ...searchValue });
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
              <FormField label={t("status")}>
                <Select
                  value={values.status}
                  name="status"
                  onChange={handleChange}
                  isClearable
                  values={codes10.values
                    .filter((v) => v.shouldDo !== "SET_OFF_DUTY" && v.type === "STATUS_CODE")
                    .map((status) => ({
                      label: status.value.value,
                      value: status.id,
                    }))}
                />
              </FormField>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.SelectOfficer)}
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
        )}
      </Formik>
    </Modal>
  );
}
