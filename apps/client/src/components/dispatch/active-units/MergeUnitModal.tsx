import type { CombinedEmsFdUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Select } from "components/form/Select";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils/typeguards";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import type { PostDispatchStatusMergeOfficers } from "@snailycad/types/api";
import type { ActiveDeputy } from "state/ems-fd-state";
import type { ActiveOfficer } from "state/leo-state";

interface Props {
  isDispatch: boolean;
  unit: Officer | EmsFdDeputy;
  onClose?(): void;

  type: "leo" | "ems-fd";

  activeUnits: (EmsFdDeputy | CombinedEmsFdUnit | Officer | CombinedLeoUnit)[];
  setActiveUnits(units: (EmsFdDeputy | CombinedEmsFdUnit | Officer | CombinedLeoUnit)[]): void;

  activeUnit: ActiveDeputy | ActiveOfficer | null;
  setActiveUnit(unit: EmsFdDeputy | CombinedEmsFdUnit | Officer | CombinedLeoUnit | null): void;
}

export function MergeUnitModal({
  unit,
  isDispatch,
  activeUnits,
  setActiveUnits,
  activeUnit,
  setActiveUnit,
  onClose,
  type,
}: Props) {
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.MergeUnit);
  }

  function makeValuesOption(unit: Officer | EmsFdDeputy, fixed?: boolean) {
    return {
      label: `${generateCallsign(unit)} ${makeUnitName(unit)}`,
      value: unit.id,
      isFixed: fixed,
    };
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostDispatchStatusMergeOfficers>({
      path: `/dispatch/status/merge/${type}`,
      method: "POST",
      data: values.ids.map((v) => ({
        entry: isDispatch ? v.isFixed : v.value === activeUnit?.id && v.isFixed,
        id: v.value,
      })),
    });

    if (json.id) {
      const newOfficers = [];

      for (const officer of activeUnits) {
        if (values.ids.some((v) => v.value === officer.id)) {
          continue;
        }

        newOfficers.push(officer);
      }

      if (!isDispatch) {
        setActiveUnit(json);
      }

      setActiveUnits([json, ...newOfficers]);
      handleClose();
    }
  }

  const isCombined = activeUnit && (isUnitCombined(activeUnit) || isUnitCombinedEmsFd(activeUnit));
  const INITIAL_VALUES = {
    ids:
      activeUnit && !isCombined && !isDispatch
        ? [makeValuesOption(activeUnit, true), makeValuesOption(unit, true)]
        : [makeValuesOption(unit, true)],
  };

  const title = type === "leo" ? t("mergeOfficers") : t("mergeDeputies");
  const label = type === "leo" ? t("officers") : t("deputies");

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen(ModalIds.MergeUnit)}
      title={title}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ values, handleChange }) => (
          <Form>
            <FormField label={label}>
              <Select
                isMulti
                values={activeUnits
                  .filter((u) => !isUnitCombined(u) || !isUnitCombinedEmsFd(u))
                  .map((v) => makeValuesOption(v as EmsFdDeputy | Officer))}
                name="ids"
                onChange={handleChange}
                value={values.ids}
              />
            </FormField>

            <footer className="flex mt-5 justify-end">
              <Button onPress={handleClose} type="button" variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                disabled={state === "loading"}
                className="flex items-center ml-2"
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}
                {t("merge")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
