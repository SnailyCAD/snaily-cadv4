import { useTranslations } from "use-intl";
import { Loader, Button, AsyncListSearchField, Item } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { FormField } from "components/form/FormField";
import useFetch from "lib/useFetch";
import { makeUnitName, yesOrNoText } from "lib/utils";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Toggle } from "components/form/Toggle";
import type { Put911CallByIdData } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import type { CombinedEmsFdUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { useImageUrl } from "hooks/useImageUrl";
import { ImageWrapper } from "components/shared/image-wrapper";
import { FormRow } from "components/form/FormRow";
import type { ActiveDeputy } from "state/ems-fd-state";
import type { ActiveOfficer } from "state/leo-state";
import { Infofield } from "components/shared/Infofield";
import { TrashFill } from "react-bootstrap-icons";

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
    const assignedUnitsById = [...call.assignedUnits].map((v) => ({
      id: v.officerId || v.emsFdDeputyId || v.combinedLeoId || v.combinedEmsFdId,
      isPrimary: v.isPrimary,
    }));

    const newAssignedUnits = [...values.units].map((unit) => ({
      id: unit.id,
      isPrimary: unit.isPrimary,
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
        assignedUnits: [...assignedUnitsById, ...newAssignedUnits],
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

  function handleRemoveUnit(
    unit: (typeof values.units)[number],
    values: typeof INITIAL_VALUES,
    setValues: any,
  ) {
    setValues({
      ...values,
      units: values.units.filter((v) => v.id !== unit.id),
    });
  }

  function handleAddUnit(values: typeof INITIAL_VALUES, setValues: any) {
    if (values.unit) {
      if (values.units.some((v) => v.id === values.unit?.id)) {
        setValues({
          ...values,
          unit: null,
          unitQuery: "",
          isPrimary: false,
        });
        return;
      }

      setValues({
        ...values,
        units: [...values.units, { ...values.unit, isPrimary: values.isPrimary }],
        unit: null,
        unitQuery: "",
        isPrimary: false,
      });
    }
  }

  const INITIAL_VALUES = {
    units: [] as (
      | (ActiveDeputy & { isPrimary?: boolean })
      | (ActiveOfficer & { isPrimary?: boolean })
    )[],

    unit: null as
      | ((ActiveDeputy & { isPrimary?: boolean }) | (ActiveOfficer & { isPrimary?: boolean }))
      | null,
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
            <div className="border border-secondary rounded-md p-4 mt-5">
              <AsyncListSearchField<Officer | EmsFdDeputy | CombinedLeoUnit | CombinedEmsFdUnit>
                autoFocus
                setValues={({ localValue, node }) => {
                  const unitQuery =
                    typeof localValue !== "undefined" ? { unitQuery: localValue } : {};
                  const unitId = node
                    ? { unit: node.value, unitQuery: localValue || values.unitQuery }
                    : {};

                  setValues({ ...values, ...unitQuery, ...unitId });
                }}
                localValue={values.unitQuery}
                errorMessage={errors.unit}
                selectedKey={values.unit?.id}
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
                  const nameAndCallsign = `${generateCallsign(item, template)} ${makeUnitName(
                    item,
                  )}`;
                  const imageId =
                    isUnitCombined(item) || isUnitCombinedEmsFd(item) ? null : item.imageId;

                  return (
                    <Item key={item.id} textValue={nameAndCallsign}>
                      <div className="flex items-center">
                        {imageId ? (
                          <ImageWrapper
                            quality={70}
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

              <FormRow flexLike className="items-center">
                <FormField className="mt-3" checkbox label={t("primaryUnit")}>
                  <Toggle
                    onCheckedChange={handleChange}
                    value={values.isPrimary}
                    name="isPrimary"
                  />
                </FormField>

                <Button
                  type="button"
                  onPress={() => handleAddUnit(values, setValues)}
                  className="max-h-9 max-w-fit"
                >
                  {t("addUnit")}
                </Button>
              </FormRow>
            </div>

            <ul className="border border-secondary rounded-md p-4 mt-5">
              {values.units.length <= 0
                ? t("noUnitsAdded")
                : values.units.map((unit) => {
                    const templateId =
                      isUnitCombined(unit) || isUnitCombinedEmsFd(unit)
                        ? "pairedUnitTemplate"
                        : "callsignTemplate";
                    const callsignAndName = `${generateCallsign(unit, templateId)} ${makeUnitName(
                      unit,
                    )}`;

                    return (
                      <li key={unit.id} className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{callsignAndName}</p>
                          <Infofield label={t("primaryUnit")}>
                            {common(yesOrNoText(unit.isPrimary ?? false))}
                          </Infofield>
                        </div>

                        <Button
                          className="p-2"
                          size="xs"
                          type="button"
                          onClick={() => handleRemoveUnit(unit, values, setValues)}
                        >
                          <TrashFill />
                        </Button>
                      </li>
                    );
                  })}
            </ul>

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
