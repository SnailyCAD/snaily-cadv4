import { useTranslations } from "use-intl";
import {
  Loader,
  Button,
  AsyncListSearchField,
  Item,
  SwitchField,
  FormRow,
  Infofield,
} from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { makeUnitName, yesOrNoText } from "lib/utils";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import type { Put911CallByIdData } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import type { CombinedEmsFdUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { useImageUrl } from "hooks/useImageUrl";
import { ImageWrapper } from "components/shared/image-wrapper";
import type { ActiveDeputy } from "state/ems-fd-state";
import type { ActiveOfficer } from "state/leo-state";
import { TrashFill } from "react-bootstrap-icons";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";

interface Props {
  onClose?(): void;
}

type SetValues<Values> = (values: React.SetStateAction<Values>) => void;

export function AddUnitToCallModal({ onClose }: Props) {
  const modalState = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const call911State = useCall911State();
  const call = call911State.currentlySelectedCall!;
  const { makeImageUrl } = useImageUrl();
  const { activeOfficers } = useActiveOfficers();
  const { activeDeputies } = useActiveDeputies();

  const t = useTranslations("Calls");

  function handleClose() {
    onClose?.();
    modalState.closeModal(ModalIds.AddAssignedUnit);
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

  function handleAddAllUnits(
    values: typeof INITIAL_VALUES,
    setValues: SetValues<typeof INITIAL_VALUES>,
  ) {
    const units = [...activeOfficers, ...activeDeputies].map((unit) => ({
      ...unit,
      isPrimary: false,
    }));

    setValues({
      ...values,
      units: [...values.units, ...units],
    });
  }

  function handleAddUnit(
    values: typeof INITIAL_VALUES,
    setValues: SetValues<typeof INITIAL_VALUES>,
  ) {
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
      isOpen={modalState.isOpen(ModalIds.AddAssignedUnit)}
      onClose={handleClose}
      title={t("addUnit")}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, setValues, values, errors }) => (
          <Form>
            <div className="border border-secondary rounded-md p-4 mt-5">
              <AsyncListSearchField<Officer | EmsFdDeputy | CombinedLeoUnit | CombinedEmsFdUnit>
                autoFocus
                onInputChange={(value) => setFieldValue("unitQuery", value)}
                onSelectionChange={(node) => {
                  if (node?.value) {
                    setValues({
                      ...values,
                      unit: node.value,
                      unitQuery: node.textValue,
                    });
                  }
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

                  const status =
                    item.statusId && item.status?.shouldDo !== "SET_OFF_DUTY"
                      ? item.status?.value.value
                      : null;
                  const statusText = status ? `(${status})` : "";

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
                        <p>
                          {nameAndCallsign} {statusText}
                        </p>
                      </div>
                    </Item>
                  );
                }}
              </AsyncListSearchField>

              <FormRow useFlex className="items-center justify-between">
                <SwitchField
                  className="mt-3"
                  isSelected={values.isPrimary}
                  onChange={(isSelected) => setFieldValue("isPrimary", isSelected)}
                >
                  {t("primaryUnit")}
                </SwitchField>

                <div>
                  <Button
                    type="button"
                    onPress={() => handleAddAllUnits(values, setValues)}
                    className="max-h-9 max-w-fit mr-2"
                    variant="cancel"
                  >
                    {t("addAllUnits")}
                  </Button>

                  <Button
                    type="button"
                    onPress={() => handleAddUnit(values, setValues)}
                    className="max-h-9 max-w-fit"
                  >
                    {t("addUnit")}
                  </Button>
                </div>
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

                    const status =
                      unit.statusId && unit.status?.shouldDo !== "SET_OFF_DUTY"
                        ? unit.status?.value.value
                        : null;
                    const statusText = status ? `(${status})` : "";

                    return (
                      <li key={unit.id} className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {callsignAndName} {statusText}
                          </p>
                          <Infofield label={t("primaryUnit")}>
                            {common(yesOrNoText(unit.isPrimary ?? false))}
                          </Infofield>
                        </div>

                        <Button
                          className="p-2"
                          size="xs"
                          type="button"
                          onPress={() => handleRemoveUnit(unit, values, setValues)}
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
