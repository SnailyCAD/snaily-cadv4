import * as React from "react";
import { useTranslations } from "use-intl";
import { Loader, Button } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { FormField } from "components/form/FormField";
import useFetch from "lib/useFetch";
import { Select } from "components/form/Select";
import { useDispatchState } from "state/dispatch/dispatchState";
import { makeUnitName } from "lib/utils";
import type { CombinedLeoUnit, EmsFdDeputy } from "@snailycad/types";
import { isUnitCombined } from "@snailycad/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Toggle } from "components/form/Toggle";
import type { Put911CallByIdData } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call911State";

interface Props {
  onClose?(): void;
}

export function AddUnitToCallModal({ onClose }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { allOfficers, allDeputies, activeDeputies, activeOfficers } = useDispatchState();
  const { generateCallsign } = useGenerateCallsign();
  const call911State = useCall911State();
  const call = call911State.currentlySelectedCall!;

  const allUnits = [...allOfficers, ...allDeputies] as (EmsFdDeputy | CombinedLeoUnit)[];
  const units = [...activeOfficers, ...activeDeputies] as (EmsFdDeputy | CombinedLeoUnit)[];
  const filteredUnits = units.filter((unit) => {
    return call.assignedUnits?.every((assignedUnit) => assignedUnit.unit?.id !== unit.id) ?? true;
  });

  const t = useTranslations("Calls");

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.AddAssignedUnit);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!values.unit) return;

    const newAssignedUnits = [...call.assignedUnits].map((v) => ({
      id: v.officerId || v.emsFdDeputyId || v.combinedLeoId,
      isPrimary: v.isPrimary,
    }));

    const { json } = await execute<Put911CallByIdData>({
      path: `/911-calls/${call.id}`,
      method: "PUT",
      data: {
        ...call,
        situationCode: call.situationCodeId,
        type: call.typeId,
        events: undefined,
        divisions: undefined,
        departments: undefined,
        assignedUnits: [...newAssignedUnits, { id: values.unit, isPrimary: values.isPrimary }],
      },
    });

    if (json.id) {
      handleClose();
      call911State.setCurrentlySelectedCall({ ...call, ...json });
      call911State.setCalls(
        call911State.calls.map((_call) => {
          if (_call.id === call.id) {
            return { ..._call, ...json };
          }

          return _call;
        }),
      );
    }
  }

  function makeLabel(value: string | undefined) {
    const unit = allUnits.find((v) => v.id === value) ?? units.find((v) => v.id === value);

    if (unit && isUnitCombined(unit)) {
      return generateCallsign(unit, "pairedUnitTemplate");
    }

    return unit ? `${generateCallsign(unit)} ${makeUnitName(unit)}` : "";
  }

  const INITIAL_VALUES = {
    unit: null as string | null,
    isPrimary: false,
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.AddAssignedUnit)}
      onClose={handleClose}
      title={t("addUnit")}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form>
            <FormField errorMessage={errors.unit as string} label={t("unit")}>
              <Select
                name="unit"
                value={values.unit}
                onChange={handleChange}
                values={filteredUnits.map((unit) => ({
                  label: makeLabel(unit.id),
                  value: unit.id,
                }))}
              />
            </FormField>

            <FormField className="mt-3" checkbox label={t("primaryUnit")}>
              <Toggle onCheckedChange={handleChange} value={values.isPrimary} name="isPrimary" />
            </FormField>

            <footer className="flex mt-5 justify-end">
              <div className="flex">
                <Button onPress={handleClose} type="button" variant="cancel">
                  {common("cancel")}
                </Button>
                <Button className="flex items-center ml-2" type="submit">
                  {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}

                  {common("save")}
                </Button>
              </div>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
