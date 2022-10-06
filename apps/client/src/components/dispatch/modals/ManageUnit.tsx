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
import type { ActiveOfficer } from "state/leoState";
import { useValues } from "context/ValuesContext";
import { useDispatchState } from "state/dispatch/dispatchState";
import type { ActiveDeputy } from "state/emsFdState";
import { makeUnitName } from "lib/utils";
import { CombinedLeoUnit, StatusValueType, StatusValue } from "@snailycad/types";
import { classNames } from "lib/classNames";
import { useUnitStatusChange } from "hooks/shared/useUnitsStatusChange";
import { isUnitCombined } from "@snailycad/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import type { PostDispatchStatusUnmergeUnitById } from "@snailycad/types/api";

interface Props {
  type?: "ems-fd" | "leo";
  unit: ActiveOfficer | ActiveDeputy | CombinedLeoUnit | null;
  onClose?(): void;
}

export function ManageUnitModal({ type = "leo", unit, onClose }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { codes10 } = useValues();
  const { activeOfficers, activeDeputies, setActiveDeputies, setActiveOfficers } =
    useDispatchState();
  const { generateCallsign } = useGenerateCallsign();

  const t = useTranslations("Leo");
  const setUnits = type === "leo" ? setActiveOfficers : setActiveDeputies;
  const units = type === "leo" ? activeOfficers : activeDeputies;

  const { state: statusState, setStatus } = useUnitStatusChange({ setUnits, units });

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageUnit);
  }

  async function handleUnmerge() {
    if (!unit) return;

    const { json } = await execute<PostDispatchStatusUnmergeUnitById>({
      path: `/dispatch/status/unmerge/${unit.id}`,
      method: "POST",
    });

    if (json) {
      handleClose();
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!unit) return;

    const status = codes10.values.find((s) => s.id === values.status);
    if (!status) return;

    const json = await setStatus(unit.id, status);

    if (json?.id) {
      handleClose();
    }
  }

  if (!unit) {
    return null;
  }

  const title = isUnitCombined(unit)
    ? `${common("manage")} ${generateCallsign(unit, "pairedUnitTemplate")}`
    : `${common("manage")} ${generateCallsign(unit)} ${makeUnitName(unit)}`;

  const INITIAL_VALUES = {
    status: unit.status?.id ?? null,
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.ManageUnit)}
      onClose={handleClose}
      title={title}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form>
            <FormField errorMessage={errors.status} label={t("status")}>
              <Select
                name="status"
                value={values.status}
                values={codes10.values
                  .filter((v) => handleFilter(v, "departmentId" in unit ? unit.departmentId : null))
                  .map((v) => ({
                    label: v.value.value,
                    value: v.id,
                  }))}
                onChange={handleChange}
              />
            </FormField>

            <footer
              className={classNames(
                "flex mt-5",
                isUnitCombined(unit) ? "justify-between" : "justify-end",
              )}
            >
              {isUnitCombined(unit) ? (
                <Button
                  disabled={state === "loading"}
                  onPress={handleUnmerge}
                  type="button"
                  variant="danger"
                  className="flex items-center ml-2"
                >
                  {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}

                  {t("unmerge")}
                </Button>
              ) : null}

              <div className="flex">
                <Button onPress={handleClose} type="button" variant="cancel">
                  {common("cancel")}
                </Button>
                <Button className="flex items-center ml-2" type="submit">
                  {statusState === "loading" ? <Loader className="mr-2 border-red-200" /> : null}

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

function handleFilter(status: StatusValue, departmentId: string | null) {
  if (!departmentId) return true;
  if (status.type !== StatusValueType.STATUS_CODE) {
    return false;
  }

  const checkDepartments = departmentId && (status.departments ?? []).length > 0;
  if (checkDepartments && !status.departments?.some((v) => v.id === departmentId)) {
    return false;
  }

  return true;
}
