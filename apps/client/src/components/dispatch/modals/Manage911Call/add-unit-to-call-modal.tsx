import { useTranslations } from "use-intl";
import { Loader, Button, AsyncListSearchField, Item } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { FormField } from "components/form/FormField";
import useFetch from "lib/useFetch";
import { makeUnitName } from "lib/utils";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Toggle } from "components/form/Toggle";
import type { Put911CallByIdData } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import type { CombinedEmsFdUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import Image from "next/image";
import { useImageUrl } from "hooks/useImageUrl";

interface Props {
  onClose?(): void;
}

export function AddUnitToCallModal({ onClose }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const call911State = useCall911State();
  const call = call911State.currentlySelectedCall!;
  const { makeImageUrl } = useImageUrl();

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

  const INITIAL_VALUES = {
    unit: null as string | null,
    unitQuery: "",
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
        {({ handleChange, setValues, values, errors }) => (
          <Form>
            <AsyncListSearchField<Officer | EmsFdDeputy | CombinedLeoUnit | CombinedEmsFdUnit>
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
                const template =
                  isUnitCombined(item) || isUnitCombinedEmsFd(item)
                    ? "pairedUnitTemplate"
                    : "callsignTemplate";
                const nameAndCallsign = `${generateCallsign(item, template)} ${makeUnitName(item)}`;
                const imageId =
                  isUnitCombined(item) || isUnitCombinedEmsFd(item) ? null : item.imageId;

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
