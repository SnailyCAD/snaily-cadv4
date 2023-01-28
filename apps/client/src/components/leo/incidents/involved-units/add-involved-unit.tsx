import { useTranslations } from "use-intl";
import { Loader, Button, AsyncListSearchField, Item } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { makeUnitName } from "lib/utils";
import { isUnitCombined } from "@snailycad/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import type { PutIncidentByIdData } from "@snailycad/types/api";
import type { CombinedLeoUnit, EmsFdDeputy, LeoIncident, Officer } from "@snailycad/types";
import { shallow } from "zustand/shallow";
import { useDispatchState } from "state/dispatch/dispatch-state";
import Image from "next/image";
import { useImageUrl } from "hooks/useImageUrl";

interface Props {
  onClose?(): void;
  incident: LeoIncident;
}

export function AddInvolvedUnitToIncidentModal({ onClose, incident }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const { activeIncidents, setActiveIncidents } = useDispatchState(
    (state) => ({
      setActiveIncidents: state.setActiveIncidents,
      activeIncidents: state.activeIncidents,
    }),
    shallow,
  );

  const { makeImageUrl } = useImageUrl();
  const t = useTranslations("Calls");

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.AddInvolvedUnit);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!values.unit) return;

    const newUnitsInvolved = [...incident.unitsInvolved].map(
      (v) => v.officerId || v.emsFdDeputyId || v.combinedLeoId || v.combinedEmsFdId,
    );

    const { json } = await execute<PutIncidentByIdData>({
      path: `/incidents/${incident.id}`,
      method: "PUT",
      data: {
        ...incident,
        unitsInvolved: [...newUnitsInvolved, values.unit],
      },
    });

    if (json.id) {
      handleClose();

      setActiveIncidents(
        activeIncidents.map((_incident) => {
          if (_incident.id === incident.id) {
            return { ..._incident, ...json };
          }

          return _incident;
        }),
      );
    }
  }

  const INITIAL_VALUES = {
    unit: null as string | null,
    unitQuery: "",
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.AddInvolvedUnit)}
      onClose={handleClose}
      title={t("addUnit")}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setValues, values, errors }) => (
          <Form>
            <AsyncListSearchField<Officer | EmsFdDeputy | CombinedLeoUnit>
              autoFocus
              setValues={({ localValue, node }) => {
                const unitQuery =
                  typeof localValue !== "undefined" ? { unitQuery: localValue } : {};
                const unitId = node
                  ? { unit: node.key as string, unitQuery: localValue || values.unitQuery }
                  : {};

                setValues({ ...values, ...unitQuery, ...unitId });
              }}
              localValue={values.unitQuery}
              errorMessage={errors.unit}
              selectedKey={values.unit}
              fetchOptions={{
                apiPath: "/dispatch/units/search",
                bodyKey: "query",
                filterTextRequired: false,
                method: "POST",
              }}
              label={t("unit")}
            >
              {(item) => {
                const template = isUnitCombined(item) ? "pairedUnitTemplate" : "callsignTemplate";
                const nameAndCallsign = `${generateCallsign(item, template)} ${makeUnitName(item)}`;
                const imageId = isUnitCombined(item) ? null : item.imageId;

                return (
                  <Item key={item.id} textValue={nameAndCallsign}>
                    <div className="flex items-center">
                      {imageId ? (
                        <Image
                          alt={nameAndCallsign}
                          className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                          draggable={false}
                          src={makeImageUrl("units", imageId)!}
                          loading="lazy"
                          width={30}
                          height={30}
                        />
                      ) : null}
                      <p>{nameAndCallsign}</p>
                    </div>
                  </Item>
                );
              }}
            </AsyncListSearchField>

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
