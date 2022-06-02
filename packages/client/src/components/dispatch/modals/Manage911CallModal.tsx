import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { Input } from "components/form/inputs/Input";
import { FormField } from "components/form/FormField";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { Full911Call, useDispatchState } from "state/dispatchState";
import { useRouter } from "next/router";
import { Select, SelectValue } from "components/form/Select";
import { AlertModal } from "components/modal/AlertModal";
import { CallEventsArea } from "../911Call/EventsArea";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { EmsFdDeputy, StatusValueType, type CombinedLeoUnit } from "@snailycad/types";
import { FormRow } from "components/form/FormRow";
import { handleValidate } from "lib/handleValidate";
import { CALL_911_SCHEMA } from "@snailycad/schemas";
import { dataToSlate, Editor } from "components/modal/DescriptionModal/Editor";
import { useValues } from "context/ValuesContext";
import { isUnitCombined } from "@snailycad/utils";
import { toastMessage } from "lib/toastMessage";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { useLeoState } from "state/leoState";
import { useEmsFdState } from "state/emsFdState";

interface Props {
  call: Full911Call | null;
  forceOpen?: boolean;
  setCall?: React.Dispatch<React.SetStateAction<Full911Call | null>>;
  onClose?(): void;
}

export function Manage911CallModal({ setCall, forceOpen, call, onClose }: Props) {
  const [showAlert, setShowAlert] = React.useState(false);

  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { state, execute } = useFetch();
  const { setCalls, calls } = useDispatchState();
  const router = useRouter();
  const { hasPermissions } = usePermission();
  const { allOfficers, allDeputies, activeDeputies, activeOfficers } = useDispatchState();
  const { generateCallsign } = useGenerateCallsign();
  const { department, division, codes10, callType } = useValues();
  const { activeOfficer } = useLeoState();
  const { activeDeputy } = useEmsFdState();

  const hasDispatchPermissions = hasPermissions(
    defaultPermissions.defaultDispatchPermissions,
    (u) => u.isDispatch,
  );

  const activeUnit = router.pathname.includes("/officer") ? activeOfficer : activeDeputy;
  const isDispatch = router.pathname.includes("/dispatch") && hasDispatchPermissions;
  const isCitizen = router.pathname.includes("/citizen");
  const isDisabled = isDispatch
    ? false
    : call
    ? !call?.assignedUnits.some((u) => u.unit.id === activeUnit?.id)
    : false;

  const allUnits = [...allOfficers, ...allDeputies] as (EmsFdDeputy | CombinedLeoUnit)[];
  const units = [...activeOfficers, ...activeDeputies] as (EmsFdDeputy | CombinedLeoUnit)[];

  const handleAddUpdateCallEvent = React.useCallback(
    (call: Full911Call) => {
      setCall?.(call);
      setCalls(calls.map((c) => (c.id === call.id ? call : c)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [call, calls],
  );

  function handleEndClick() {
    if (!call || isDisabled) return;

    setShowAlert(true);
  }

  function handleClose() {
    onClose?.();

    setShowAlert(false);
    closeModal(ModalIds.Manage911Call);
  }

  async function handleDelete() {
    if (!call || isDisabled) return;

    const { json } = await execute(`/911-calls/${call.id}`, {
      method: "DELETE",
    });

    if (json) {
      handleClose();
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (isDisabled) return;

    const requestData = {
      ...values,
      assignedUnits: values.assignedUnits.map(({ value }) => value),
      departments: values.departments.map(({ value }) => value),
      divisions: values.divisions.map(({ value }) => value),
    };

    if (call) {
      const { json } = await execute(`/911-calls/${call.id}`, {
        method: "PUT",
        data: requestData,
      });

      if (json.id) {
        setCalls(calls.map((c) => (c.id === json.id ? json : c)));
        closeModal(ModalIds.Manage911Call);
      }
    } else {
      const { json } = await execute("/911-calls", {
        method: "POST",
        data: requestData,
      });

      if (json.id) {
        if (isCitizen) {
          toastMessage({
            title: common("success"),
            message: t("911CallCreated"),
            icon: "success",
          });
        }

        setCalls([json, ...calls]);
        closeModal(ModalIds.Manage911Call);
      }
    }
  }

  const validate = handleValidate(CALL_911_SCHEMA);
  const INITIAL_VALUES = {
    name: call?.name ?? "",
    location: call?.location ?? "",
    postal: call?.postal ?? "",
    description: call?.description ?? "",
    descriptionData: dataToSlate(call),
    departments: call?.departments?.map((dep) => ({ value: dep.id, label: dep.value.value })) ?? [],
    divisions: call?.divisions?.map((dep) => ({ value: dep.id, label: dep.value.value })) ?? [],
    situationCode: call?.situationCodeId ?? null,
    callType: call?.typeId ?? null,
    assignedUnits:
      call?.assignedUnits.map((unit) => ({
        label: makeLabel(unit.unit.id),
        value: unit.unit.id,
      })) ?? ([] as SelectValue[]),
  };

  function makeLabel(value: string) {
    const unit = allUnits.find((v) => v.id === value) ?? units.find((v) => v.id === value);

    if (unit && isUnitCombined(unit)) {
      return generateCallsign(unit, "pairedUnitTemplate");
    }

    return unit ? `${generateCallsign(unit)} ${makeUnitName(unit)}` : "";
  }

  return (
    <Modal
      isOpen={forceOpen ?? isOpen(ModalIds.Manage911Call)}
      onClose={handleClose}
      title={call ? t("manage911Call") : t("create911Call")}
      className={call ? "w-[1200px]" : "w-[650px]"}
    >
      <div className="flex flex-col md:flex-row">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, setFieldValue, values, errors }) => (
            <Form className="w-full h-full">
              <FormField errorMessage={errors.name} label={common("name")}>
                <Input
                  disabled={isDisabled}
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                />
              </FormField>

              <FormRow>
                <FormField errorMessage={errors.location} label={t("location")}>
                  <Input
                    disabled={isDisabled}
                    name="location"
                    value={values.location}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField errorMessage={errors.postal} label={t("postal")}>
                  <Input
                    disabled={isDisabled}
                    name="postal"
                    value={values.postal}
                    onChange={handleChange}
                  />
                </FormField>
              </FormRow>

              {router.pathname.includes("/citizen") ? null : (
                <>
                  <FormField
                    errorMessage={errors.assignedUnits as string}
                    label={t("assignedUnits")}
                  >
                    <Select
                      extra={{ showContextMenuForUnits: true }}
                      isMulti
                      name="assignedUnits"
                      value={values.assignedUnits.map((value) => ({
                        label: makeLabel(value.value),
                        value: value.value,
                      }))}
                      values={units.map((unit) => ({
                        label: makeLabel(unit.id),
                        value: unit.id,
                      }))}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </FormField>

                  <FormRow>
                    <FormField errorMessage={errors.departments as string} label={t("departments")}>
                      <Select
                        isMulti
                        name="departments"
                        value={values.departments}
                        values={department.values.map((department) => ({
                          label: department.value.value,
                          value: department.id,
                        }))}
                        onChange={handleChange}
                        disabled={isDisabled}
                      />
                    </FormField>

                    <FormField errorMessage={errors.divisions as string} label={t("divisions")}>
                      <Select
                        isMulti
                        name="divisions"
                        value={values.divisions}
                        values={division.values
                          .filter((div) => {
                            const isInDepartment = values.departments.some(
                              (v) => v.value === div.departmentId,
                            );

                            return values.departments.length > 0 ? isInDepartment : true;
                          })
                          .map((division) => ({
                            label: division.value.value,
                            value: division.id,
                          }))}
                        onChange={handleChange}
                        disabled={isDisabled}
                      />
                    </FormField>
                  </FormRow>

                  <FormRow>
                    <FormField errorMessage={errors.situationCode} label={t("situationCode")}>
                      <Select
                        isClearable
                        name="situationCode"
                        value={values.situationCode}
                        values={codes10.values
                          .filter((v) => v.type === StatusValueType.SITUATION_CODE)
                          .map((division) => ({
                            label: division.value.value,
                            value: division.id,
                          }))}
                        onChange={handleChange}
                        disabled={isDisabled}
                      />
                    </FormField>

                    <FormField errorMessage={errors.callType} label={t("type")}>
                      <Select
                        isClearable
                        name="callType"
                        value={values.callType}
                        values={callType.values.map((callType) => ({
                          label: callType.value.value,
                          value: callType.id,
                        }))}
                        onChange={handleChange}
                        disabled={isDisabled}
                      />
                    </FormField>
                  </FormRow>
                </>
              )}

              <FormField errorMessage={errors.description} label={common("description")}>
                <Editor
                  value={values.descriptionData}
                  onChange={(v) => setFieldValue("descriptionData", v)}
                  isReadonly={isDisabled}
                />
              </FormField>

              <footer className={`mt-5 flex ${call ? "justify-between" : "justify-end"}`}>
                {call ? (
                  <Button
                    onClick={handleEndClick}
                    type="button"
                    variant="danger"
                    disabled={isDisabled}
                  >
                    {t("endCall")}
                  </Button>
                ) : null}

                <div className="flex">
                  <Button onClick={handleClose} type="button" variant="cancel">
                    {common("cancel")}
                  </Button>
                  <Button
                    disabled={isDisabled || state === "loading"}
                    className="flex items-center ml-2"
                    type="submit"
                  >
                    {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}

                    {call ? common("save") : common("create")}
                  </Button>
                </div>
              </footer>
            </Form>
          )}
        </Formik>

        {call ? (
          <CallEventsArea
            onCreate={handleAddUpdateCallEvent}
            onUpdate={handleAddUpdateCallEvent}
            disabled={isDisabled}
            call={call}
          />
        ) : null}
      </div>

      {call && showAlert ? (
        <AlertModal
          forceOpen
          id={ModalIds.AlertEnd911Call}
          title={t("end911Call")}
          description={t("alert_end911Call")}
          onDeleteClick={handleDelete}
          deleteText={t("endCall")}
          state={state}
          onClose={() => setShowAlert(false)}
        />
      ) : null}
    </Modal>
  );
}
