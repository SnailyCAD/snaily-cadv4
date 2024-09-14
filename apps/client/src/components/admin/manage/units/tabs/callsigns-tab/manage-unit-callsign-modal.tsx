import { UPDATE_UNIT_CALLSIGN_SCHEMA } from "@snailycad/schemas";
import { type DivisionValue, WhitelistStatus, ValueType } from "@snailycad/types";
import type { PutManageUnitCallsignData } from "@snailycad/types/api";
import { isUnitOfficer } from "@snailycad/utils";
import { Button, FormRow, Loader, TextField } from "@snailycad/ui";
import { CallSignPreview } from "components/leo/CallsignPreview";
import { AdvancedSettings } from "components/leo/modals/AdvancedSettings";
import { makeDivisionsObjectMap } from "components/leo/modals/ManageOfficerModal";
import { Modal } from "components/modal/Modal";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import type { Unit } from "src/pages/admin/manage/units";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { Permissions, usePermission } from "hooks/usePermission";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { useValues } from "context/ValuesContext";
import { getUnitDepartment } from "lib/utils";

interface Props {
  unit: Unit;
  onUpdate?(unit: PutManageUnitCallsignData): void;
}

export function ManageUnitCallsignModal({ onUpdate, unit }: Props) {
  const t = useTranslations();
  const modalState = useModal();
  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const { officerRank } = useValues();

  const hasManageCallsignPermissions = hasPermissions([Permissions.ManageUnitCallsigns]);
  const hasManageRankPermissions = hasPermissions([Permissions.ManageUnitRank]);

  async function handleSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PutManageUnitCallsignData>({
      path: `/admin/manage/units/callsign/${unit.id}`,
      method: "PUT",
      data: values,
    });

    if (json.id) {
      modalState.closeModal(ModalIds.ManageUnitCallsign);
      onUpdate?.(json);
    }
  }

  const validate = handleValidate(UPDATE_UNIT_CALLSIGN_SCHEMA);
  const divisions = (isUnitOfficer(unit) ? unit.divisions : [unit.division]).filter(
    Number,
  ) as DivisionValue[];
  const INITIAL_VALUES = {
    citizenId: unit.citizenId,
    callsign: unit.callsign,
    callsign2: unit.callsign2,
    callsigns: isUnitOfficer(unit) ? makeDivisionsObjectMap(unit) : {},
    divisions: divisions.map((d) => ({ value: d.id, label: d.value.value })),
    rank: unit.rankId,
    position: unit.position ?? "",
    department: getUnitDepartment(unit)?.id ?? "",
  };

  const areFormFieldsDisabled = unit.whitelistStatus?.status === WhitelistStatus.PENDING;

  return (
    <Modal
      title={t("Common.manage")}
      onClose={() => modalState.closeModal(ModalIds.ManageUnitCallsign)}
      isOpen={modalState.isOpen(ModalIds.ManageUnitCallsign)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={handleSubmit}>
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
            {hasManageCallsignPermissions ? (
              <>
                <TextField
                  errorMessage={errors.callsign}
                  label={t("Leo.callsign1")}
                  autoFocus
                  name="callsign"
                  onChange={(value) => setFieldValue("callsign", value)}
                  value={values.callsign}
                />
                <TextField
                  errorMessage={errors.callsign2}
                  label={t("Leo.callsign2")}
                  name="callsign2"
                  onChange={(value) => setFieldValue("callsign2", value)}
                  value={values.callsign2}
                />
                <CallSignPreview department={unit.department} divisions={divisions} />
              </>
            ) : null}

            {hasManageRankPermissions ? (
              <FormRow>
                <ValueSelectField
                  isDisabled={areFormFieldsDisabled}
                  label={t("Leo.rank")}
                  fieldName="rank"
                  values={officerRank.values}
                  valueType={ValueType.OFFICER_RANK}
                  isClearable
                  filterFn={(value) => {
                    // has no departments set - allows all departments
                    if (!value.officerRankDepartments || value.officerRankDepartments.length <= 0) {
                      return true;
                    }

                    return values.department
                      ? value.officerRankDepartments.some((v) => v.id === values.department)
                      : true;
                  }}
                />

                <TextField
                  isDisabled={areFormFieldsDisabled}
                  errorMessage={errors.position}
                  label={t("Leo.position")}
                  name="position"
                  onChange={(value) => setFieldValue("position", value)}
                  value={values.position}
                />
              </FormRow>
            ) : null}

            {isUnitOfficer(unit) ? <AdvancedSettings /> : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.ManageUnitCallsign)}
                variant="cancel"
              >
                {t("Common.cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("Common.save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
