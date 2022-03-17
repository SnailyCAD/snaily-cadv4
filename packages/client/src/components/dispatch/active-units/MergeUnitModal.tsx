import * as React from "react";
import type { Officer } from "@snailycad/types";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Select } from "components/form/Select";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { isUnitOfficer } from "@snailycad/utils/typeguards";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { useLeoState } from "state/leoState";

interface Props {
  isDispatch: boolean;
  unit: Officer;
  onClose?(): void;
}

export function MergeUnitModal({ unit, isDispatch, onClose }: Props) {
  const { activeOfficer } = useLeoState();
  const { isOpen, closeModal } = useModal();
  const { activeOfficers } = useActiveOfficers();
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
    const { json } = await execute("/dispatch/status/merge", {
      method: "POST",
      data: values.ids.map((v) => ({ entry: v.isFixed, id: v.value })),
    });

    if (json.id) {
      handleClose();
    }
  }

  const INITIAL_VALUES = {
    ids:
      activeOfficer && isUnitOfficer(activeOfficer) && !isDispatch
        ? [makeValuesOption(unit, true), makeValuesOption(activeOfficer, true)]
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
              <Button onClick={handleClose} type="button" variant="cancel">
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
