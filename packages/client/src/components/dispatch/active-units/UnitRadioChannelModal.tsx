import * as React from "react";
import type { CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { Pencil } from "react-bootstrap-icons";
import { useRouter } from "next/router";
import { useDispatchState } from "state/dispatchState";
import { handleValidate } from "lib/handleValidate";
import { UPDATE_RADIO_CHANNEL_SCHEMA } from "@snailycad/schemas";
import { isUnitCombined, isUnitOfficer } from "@snailycad/utils";

interface Props {
  unit: Officer | EmsFdDeputy | CombinedLeoUnit;
  onClose?(): void;
}

export function UnitRadioChannelModal({ unit, onClose }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const dispatchState = useDispatchState();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  function handleClose() {
    onClose?.();
    setIsOpen(false);
  }

  function handleStateChange(json: any) {
    if (isOfficer(unit)) {
      dispatchState.setActiveOfficers(
        dispatchState.activeOfficers.map((off) => {
          if (off.id === unit.id) {
            return { ...unit, ...json };
          }
          return off;
        }),
      );
    } else {
      dispatchState.setActiveDeputies(
        dispatchState.activeDeputies.map((dep) => {
          if (dep.id === unit.id) {
            return { ...unit, ...json };
          }
          return dep;
        }),
      );
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    handleStateChange({ radioChannelId: values.radioChannel });

    const { json } = await execute(`/dispatch/radio-channel/${unit.id}`, {
      method: "PUT",
      data: {
        radioChannel: values.radioChannel.trim() || null,
      },
    });

    if (json.id) {
      handleStateChange(json);
      handleClose();
    }
  }

  const validate = handleValidate(UPDATE_RADIO_CHANNEL_SCHEMA);
  const INITIAL_VALUES = {
    radioChannel: unit.radioChannelId ?? "",
  };

  return (
    <>
      <span className="flex items-center gap-2">
        <span>{unit.radioChannelId ? unit.radioChannelId : common("none")}</span>

        {isDispatch ? (
          <Button variant={null} className="bg-dark-bg px-1.5" onClick={() => setIsOpen(true)}>
            <Pencil />
          </Button>
        ) : null}
      </span>

      {isOpen && isDispatch ? (
        <Modal
          onClose={handleClose}
          isOpen
          title={t("manageRadioChannel")}
          className="min-w-[500px]"
        >
          <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
            {({ values, errors, handleChange }) => (
              <Form>
                <FormField errorMessage={errors.radioChannel} label={t("radioChannel")}>
                  <Input name="radioChannel" onChange={handleChange} value={values.radioChannel} />
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

                    {common("save")}
                  </Button>
                </footer>
              </Form>
            )}
          </Formik>
        </Modal>
      ) : null}
    </>
  );
}

function isOfficer(
  unit: Officer | EmsFdDeputy | CombinedLeoUnit,
): unit is Officer | CombinedLeoUnit {
  return isUnitCombined(unit) || isUnitOfficer(unit);
}
