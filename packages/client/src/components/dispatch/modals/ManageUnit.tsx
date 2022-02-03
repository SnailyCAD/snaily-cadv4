import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { FormField } from "components/form/FormField";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { Select } from "components/form/Select";
import type { ActiveOfficer } from "state/leoState";
import { useValues } from "context/ValuesContext";
import { useDispatchState } from "state/dispatchState";
import type { ActiveDeputy } from "state/emsFdState";
import { makeUnitName } from "lib/utils";
import type { CombinedLeoUnit } from "@snailycad/types";
import { classNames } from "lib/classNames";

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
  const { activeOfficers, setActiveOfficers } = useDispatchState();
  const t = useTranslations("Leo");

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageUnit);
  }

  async function handleUnmerge() {
    if (!unit) return;

    const json = await execute(`/dispatch/status/unmerge/${unit.id}`, {
      method: "POST",
    });

    if (json) {
      handleClose();
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!unit) return;

    const { json } = await execute(`/dispatch/status/${unit.id}`, {
      method: "PUT",
      data: { ...values },
    });

    if (type === "leo" && json.id) {
      setActiveOfficers(
        activeOfficers.map((officer) => {
          if (officer.id === json.id) {
            return { ...officer, ...json };
          }

          return officer;
        }),
      );
      handleClose();
    } else if (json.id) {
      handleClose();
    }
  }

  if (!unit) {
    return null;
  }

  const title =
    "officers" in unit
      ? `${common("manage")} ${unit.callsign}`
      : `${common("manage")} ${unit.callsign} ${makeUnitName(unit)}`;

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
                values={codes10.values.map((v) => ({
                  label: v.value.value,
                  value: v.id,
                }))}
                onChange={handleChange}
              />
            </FormField>

            <footer
              className={classNames(
                "flex mt-5",
                "officers" in unit ? "justify-between" : "justify-end",
              )}
            >
              {"officers" in unit ? (
                <Button onClick={handleUnmerge} type="button" variant="danger">
                  {t("unmerge")}
                </Button>
              ) : null}

              <div className="flex">
                <Button onClick={handleClose} type="button" variant="cancel">
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
