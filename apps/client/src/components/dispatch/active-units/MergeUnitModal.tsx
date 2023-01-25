import type { Officer } from "@snailycad/types";
import { Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Select } from "components/form/Select";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { isUnitOfficer } from "@snailycad/utils/typeguards";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { useLeoState } from "state/leo-state";
import type { PostDispatchStatusMergeOfficers } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";

interface Props {
  isDispatch: boolean;
  unit: Officer;
  onClose?(): void;
}

export function MergeUnitModal({ unit, isDispatch, onClose }: Props) {
  const { activeOfficer, setActiveOfficer } = useLeoState(
    (state) => ({
      activeOfficer: state.activeOfficer,
      setActiveOfficer: state.setActiveOfficer,
    }),
    shallow,
  );
  const { isOpen, closeModal } = useModal();
  const { activeOfficers, setActiveOfficers } = useActiveOfficers();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.MergeUnit);
  }

  function makeValuesOption(officer: Officer, fixed?: boolean) {
    return {
      label: `${generateCallsign(officer)} ${makeUnitName(officer)}`,
      value: officer.id,
      isFixed: fixed,
    };
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostDispatchStatusMergeOfficers>({
      // todo: type: "officers"|"ems-fd"
      path: "/dispatch/status/merge/officers",
      method: "POST",
      data: values.ids.map((v) => ({
        entry: isDispatch ? v.isFixed : v.value === activeOfficer?.id && v.isFixed,
        id: v.value,
      })),
    });

    if (json.id) {
      const newOfficers = [];

      for (const officer of activeOfficers) {
        if (values.ids.some((v) => v.value === officer.id)) {
          continue;
        }

        newOfficers.push(officer);
      }

      if (!isDispatch) {
        setActiveOfficer(json);
      }

      setActiveOfficers([json, ...newOfficers]);
      handleClose();
    }
  }

  const INITIAL_VALUES = {
    ids:
      activeOfficer && isUnitOfficer(activeOfficer) && !isDispatch
        ? [makeValuesOption(activeOfficer, true), makeValuesOption(unit, true)]
        : [makeValuesOption(unit, true)],
  };

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen(ModalIds.MergeUnit)}
      title={t("mergeOfficers")}
      className="min-w-[500px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ values, handleChange }) => (
          <Form>
            <FormField label={t("officers")}>
              <Select
                isMulti
                values={activeOfficers.filter(isUnitOfficer).map((v) => makeValuesOption(v))}
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
