import * as React from "react";
import { useTranslations } from "use-intl";
import { Formik, FormikHelpers } from "formik";
import { VEHICLE_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useValues } from "src/context/ValuesContext";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import {
  Citizen,
  RegisteredVehicle,
  ValueLicenseType,
  VehicleTaxStatus,
  VehicleInspectionStatus,
} from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { Input } from "components/form/inputs/Input";
import { useCitizen } from "context/CitizenContext";
import { useRouter } from "next/router";
import { useAuth } from "context/AuthContext";
import { Toggle } from "components/form/Toggle";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useBusinessState } from "state/businessState";
import { filterLicenseTypes } from "lib/utils";
import { FormRow } from "components/form/FormRow";

interface Props {
  vehicle: RegisteredVehicle | null;
  citizens: Pick<Citizen, "name" | "surname" | "id">[];
  onCreate?: (newV: RegisteredVehicle) => void;
  onUpdate?: (old: RegisteredVehicle, newV: RegisteredVehicle) => void;
  onClose?(): void;
}

export function RegisterVehicleModal({
  citizens = [],
  vehicle,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Citizen");
  const tVehicle = useTranslations("Vehicles");
  const common = useTranslations("Common");
  const { citizen } = useCitizen(false);
  const router = useRouter();
  const { cad } = useAuth();
  const { DISALLOW_TEXTFIELD_SELECTION } = useFeatureEnabled();
  const { currentBusiness, currentEmployee } = useBusinessState();

  const { vehicle: vehicles, license } = useValues();
  const validate = handleValidate(VEHICLE_SCHEMA);
  const isDisabled = router.pathname === "/citizen/[id]";
  const maxPlateLength = cad?.miscCadSettings?.maxPlateLength ?? 8;

  function handleClose() {
    closeModal(ModalIds.RegisterVehicle);
    onClose?.();
  }

  const TAX_STATUS_LABELS = React.useMemo(
    () => ({
      [VehicleTaxStatus.TAXED]: tVehicle("taxed"),
      [VehicleTaxStatus.UNTAXED]: tVehicle("untaxed"),
    }),
    [tVehicle],
  );

  const TAX_STATUS = React.useMemo(() => {
    return Object.values(VehicleTaxStatus).map((v) => ({
      label: TAX_STATUS_LABELS[v],
      value: v,
    }));
  }, [TAX_STATUS_LABELS]);

  const INSPECTION_STATUS_LABELS = React.useMemo(
    () => ({
      [VehicleInspectionStatus.PASSED]: tVehicle("passed"),
      [VehicleInspectionStatus.FAILED]: tVehicle("failed"),
    }),
    [tVehicle],
  );

  const INSPECTION_STATUS = React.useMemo(() => {
    return Object.values(VehicleInspectionStatus).map((v) => ({
      label: INSPECTION_STATUS_LABELS[v],
      value: v,
    }));
  }, [INSPECTION_STATUS_LABELS]);

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (vehicle) {
      const { json } = await execute(`/vehicles/${vehicle.id}`, {
        method: "PUT",
        data: values,
        helpers,
      });

      if (json?.id) {
        onUpdate?.(vehicle, json);
      }
    } else {
      const { json } = await execute("/vehicles", {
        method: "POST",
        data: values,
        helpers,
      });

      if (json?.id) {
        onCreate?.(json);
      }
    }
  }

  const INITIAL_VALUES = {
    model: vehicle?.modelId ?? "",
    color: vehicle?.color ?? "",
    insuranceStatus: vehicle?.insuranceStatusId ?? "",
    inspectionStatus: vehicle?.inspectionStatus ?? null,
    taxStatus: vehicle?.taxStatus ?? null,
    registrationStatus: vehicle?.registrationStatusId ?? "",
    citizenId: isDisabled ? citizen.id : vehicle?.citizenId ?? "",
    plate: vehicle?.plate ?? "",
    vinNumber: vehicle?.vinNumber ?? "",
    reportedStolen: vehicle?.reportedStolen ?? false,
    businessId: currentBusiness?.id ?? null,
    employeeId: currentEmployee?.id ?? null,
  };

  return (
    <Modal
      title={t("registerVehicle")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.RegisterVehicle)}
      className="w-[700px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.plate} label={tVehicle("plate")}>
              <Input
                disabled={!!vehicle}
                onChange={handleChange}
                name="plate"
                value={values.plate.toUpperCase()}
                max={maxPlateLength}
                maxLength={maxPlateLength}
              />
            </FormField>

            <FormField optional errorMessage={errors.vinNumber} label={tVehicle("vinNumber")}>
              <Input value={values.vinNumber} name="vinNumber" onChange={handleChange} />
            </FormField>

            {DISALLOW_TEXTFIELD_SELECTION ? (
              <FormField errorMessage={errors.model} label={tVehicle("model")}>
                <Select
                  values={vehicles.values.map((vehicle) => ({
                    label: vehicle.value.value,
                    value: vehicle.id,
                  }))}
                  value={values.model}
                  name="model"
                  onChange={handleChange}
                />
              </FormField>
            ) : (
              <FormField errorMessage={errors.model} label={tVehicle("model")}>
                <Input
                  list="vehicle-models-list"
                  value={values.model}
                  name="model"
                  onChange={handleChange}
                />

                <datalist id="vehicle-models-list">
                  {vehicles.values.map((vehicle) => (
                    <span key={vehicle.id}>{vehicle.value.value}</span>
                  ))}
                </datalist>
              </FormField>
            )}

            <FormField errorMessage={errors.citizenId} label={tVehicle("owner")}>
              <Select
                values={
                  isDisabled
                    ? [{ value: citizen.id, label: `${citizen.name} ${citizen.surname}` }]
                    : citizens.map((citizen) => ({
                        label: `${citizen.name} ${citizen.surname}`,
                        value: citizen.id,
                      }))
                }
                value={isDisabled ? citizen.id : values.citizenId}
                name="citizenId"
                onChange={handleChange}
                disabled={isDisabled}
              />
            </FormField>

            <FormRow>
              <FormField
                errorMessage={errors.registrationStatus}
                label={tVehicle("registrationStatus")}
              >
                <Select
                  values={filterLicenseTypes(
                    license.values,
                    ValueLicenseType.REGISTRATION_STATUS,
                  ).map((license) => ({
                    label: license.value,
                    value: license.id,
                  }))}
                  value={values.registrationStatus}
                  name="registrationStatus"
                  onChange={handleChange}
                />
              </FormField>

              <FormField errorMessage={errors.insuranceStatus} label={tVehicle("insuranceStatus")}>
                <Select
                  isClearable
                  values={filterLicenseTypes(license.values, ValueLicenseType.INSURANCE_STATUS).map(
                    (license) => ({
                      label: license.value,
                      value: license.id,
                    }),
                  )}
                  value={values.insuranceStatus}
                  name="insuranceStatus"
                  onChange={handleChange}
                />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField
                errorMessage={errors.inspectionStatus}
                label={tVehicle("inspectionStatus")}
              >
                <Select
                  isClearable
                  values={INSPECTION_STATUS}
                  value={values.inspectionStatus}
                  name="inspectionStatus"
                  onChange={handleChange}
                />
              </FormField>

              <FormField errorMessage={errors.taxStatus} label={tVehicle("taxStatus")}>
                <Select
                  isClearable
                  values={TAX_STATUS}
                  value={values.taxStatus}
                  name="taxStatus"
                  onChange={handleChange}
                />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.color} label={tVehicle("color")}>
              <Input onChange={handleChange} name="color" value={values.color} />
            </FormField>

            {vehicle ? (
              <FormField errorMessage={errors.reportedStolen} label={tVehicle("reportAsStolen")}>
                <Toggle
                  onClick={handleChange}
                  name="reportedStolen"
                  toggled={values.reportedStolen}
                />
              </FormField>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.RegisterVehicle)}
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
                {vehicle ? common("save") : t("registerVehicle")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
}
