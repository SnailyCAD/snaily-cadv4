import * as React from "react";
import type { CombinedEmsFdUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { Loader, Button, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { Pencil } from "react-bootstrap-icons";
import { useRouter } from "next/router";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { handleValidate } from "lib/handleValidate";
import { UPDATE_RADIO_CHANNEL_SCHEMA } from "@snailycad/schemas";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import type { PutDispatchRadioChannelData } from "@snailycad/types/api";

interface Props {
  unit: Officer | EmsFdDeputy | CombinedLeoUnit | CombinedEmsFdUnit;
  onClose?(): void;
}

export function UnitRadioChannelModal({ unit, onClose }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const dispatchState = useDispatchState((state) => ({
    setActiveOfficers: state.setActiveOfficers,
    setActiveDeputies: state.setActiveDeputies,
    activeOfficers: state.activeOfficers,
    activeDeputies: state.activeDeputies,
  }));
  const { hasActiveDispatchers } = useActiveDispatchers();

  const router = useRouter();
  const isDispatch = router.pathname.includes("/dispatch");

  function handleClose() {
    onClose?.();
    setIsOpen(false);
  }

  function handleStateChange(json: any) {
    const isCombined = isUnitCombined(unit) || isUnitCombinedEmsFd(unit);

    if (!isCombined) {
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

    const { json } = await execute<PutDispatchRadioChannelData>({
      path: `/dispatch/radio-channel/${unit.id}`,
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
          <Button
            className="px-1.5"
            onPress={() => setIsOpen(true)}
            disabled={!hasActiveDispatchers}
          >
            <Pencil aria-label={t("manageRadioChannel")} className="fill-current text-white" />
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
            {({ values, errors, setFieldValue }) => (
              <Form>
                <TextField
                  errorMessage={errors.radioChannel}
                  autoFocus
                  isRequired
                  label={t("radioChannel")}
                  value={values.radioChannel}
                  onChange={(value) => setFieldValue("radioChannel", value)}
                />

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
