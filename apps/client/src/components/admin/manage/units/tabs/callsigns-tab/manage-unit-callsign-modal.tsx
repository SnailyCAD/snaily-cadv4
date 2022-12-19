import { UPDATE_UNIT_CALLSIGN_SCHEMA } from "@snailycad/schemas";
import type { DivisionValue } from "@snailycad/types";
import type { PutManageUnitCallsignData } from "@snailycad/types/api";
import { isUnitOfficer } from "@snailycad/utils";
import { Button, Loader, TextField } from "@snailycad/ui";
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
import { ModalIds } from "types/ModalIds";

interface Props {
  unit: Unit;
  onUpdate?(unit: PutManageUnitCallsignData): void;
}

export function ManageUnitCallsignModal({ onUpdate, unit }: Props) {
  const t = useTranslations();
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();

  async function handleSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PutManageUnitCallsignData>({
      path: `/admin/manage/units/callsign/${unit.id}`,
      method: "PUT",
      data: values,
    });

    if (json.id) {
      closeModal(ModalIds.ManageUnitCallsign);
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
  };

  return (
    <Modal
      title={t("Common.manage")}
      onClose={() => closeModal(ModalIds.ManageUnitCallsign)}
      isOpen={isOpen(ModalIds.ManageUnitCallsign)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={handleSubmit}>
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
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

            {isUnitOfficer(unit) ? <AdvancedSettings /> : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.ManageUnitCallsign)}
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
