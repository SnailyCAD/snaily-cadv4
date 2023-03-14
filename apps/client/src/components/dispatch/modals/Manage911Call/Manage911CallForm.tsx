import { useRouter } from "next/router";
import type { Post911CallsData, Put911CallByIdData } from "@snailycad/types/api";
import { StatusValueType, ValueType, WhitelistStatus } from "@snailycad/types";
import { FormRow } from "components/form/FormRow";
import { handleValidate } from "lib/handleValidate";
import { CALL_911_SCHEMA } from "@snailycad/schemas";
import { dataToSlate, Editor } from "components/editor/editor";
import { useValues } from "context/ValuesContext";
import { toastMessage } from "lib/toastMessage";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { Button, Input, Loader, TextField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import useFetch from "lib/useFetch";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { Select } from "components/form/Select";
import { useTranslations } from "next-intl";
import { useCall911State } from "state/dispatch/call-911-state";
import { useModal } from "state/modalState";
import { AssignedUnitsTable } from "./AssignedUnitsTable";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { AddressPostalSelect } from "components/form/select/PostalSelect";
import { shallow } from "zustand/shallow";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { useInvalidateQuery } from "hooks/use-invalidate-query";

interface Props {
  call: Full911Call | null;
  isDisabled: boolean;
  handleClose(): void;
  setShowAlert(show: boolean): void;
}

export function Manage911CallForm({ call, isDisabled, setShowAlert, handleClose }: Props) {
  const router = useRouter();
  const { department, division, codes10, callType } = useValues();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { execute, state } = useFetch();
  const { setCalls, calls, setCurrentlySelectedCall } = useCall911State(
    (state) => ({
      setCalls: state.setCalls,
      calls: state.calls,
      setCurrentlySelectedCall: state.setCurrentlySelectedCall,
    }),
    shallow,
  );
  const { closeModal, openModal } = useModal();
  const { DIVISIONS } = useFeatureEnabled();
  const { invalidateQuery } = useInvalidateQuery(["/911-calls"]);

  const validate = handleValidate(CALL_911_SCHEMA);
  const isCitizen = router.pathname.includes("/citizen");

  function handleEndClick() {
    if (!call || isDisabled) return;

    setShowAlert(true);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (isDisabled) return;

    const requestData = {
      ...values,
      departments: values.departments.map(({ value }) => value),
      divisions: values.divisions.map(({ value }) => value),
    };

    if (call) {
      const { json } = await execute<Put911CallByIdData>({
        path: `/911-calls/${call.id}`,
        method: "PUT",
        data: requestData,
      });

      if (json.id) {
        await invalidateQuery();
        setCalls(calls.map((c) => (c.id === json.id ? { ...c, ...json } : c)));
        closeModal(ModalIds.Manage911Call);
      }
    } else {
      const { json } = await execute<Post911CallsData>({
        path: "/911-calls",
        method: "POST",
        data: requestData,
      });

      if (json.id) {
        toastMessage({
          title: common("success"),
          message: t("911CallCreated"),
          icon: "success",
        });

        setCalls([json, ...calls]);
        await invalidateQuery();

        if (values.openCallModalAfterCreation && !isCitizen) {
          setCurrentlySelectedCall(json);
          openModal(ModalIds.Manage911Call, json);
        } else {
          closeModal(ModalIds.Manage911Call);
        }
      }
    }
  }

  const INITIAL_VALUES = {
    name: call?.name ?? "",
    location: call?.location ?? "",
    postal: call?.postal ?? "",
    description: call?.description ?? "",
    descriptionData: dataToSlate(call),
    departments: call?.departments?.map((dep) => ({ value: dep.id, label: dep.value.value })) ?? [],
    divisions: call?.divisions?.map((dep) => ({ value: dep.id, label: dep.value.value })) ?? [],
    situationCode: call?.situationCodeId ?? null,
    type: call?.typeId ?? null,
    notifyAssignedUnits: true,
    openCallModalAfterCreation: true,
    status: undefined,
  };

  return (
    <Formik
      enableReinitialize
      validate={validate}
      onSubmit={onSubmit}
      initialValues={INITIAL_VALUES}
    >
      {({ handleChange, setFieldValue, handleSubmit, values, errors }) => (
        <Form className="w-full h-full">
          {call?.status === WhitelistStatus.PENDING ? (
            <div
              role="alert"
              className="card px-4 py-2 w-full flex items-start justify-between my-3 text-white !bg-amber-900 border !border-amber-700"
            >
              <div className="w-[70%]">
                <h3 className="text-xl font-semibold mb-2">{t("pendingApproval")}</h3>
                <p className="text-base">{t("approvalMessage")}</p>
              </div>
            </div>
          ) : null}

          <TextField
            label={common("name")}
            name="name"
            onChange={(value) => setFieldValue("name", value)}
            value={values.name}
            errorMessage={errors.name}
            isDisabled={isDisabled}
            autoFocus
          />

          <AddressPostalSelect isDisabled={isDisabled} addressLabel="location" />
          {router.pathname.includes("/citizen") ? (
            <FormField errorMessage={errors.description} label={common("description")}>
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
                isReadonly={isDisabled}
              />
            </FormField>
          ) : (
            <>
              <FormRow flexLike={!DIVISIONS}>
                <FormField
                  className="w-full"
                  errorMessage={errors.departments as string}
                  label={t("departments")}
                >
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
                    className="w-full"
                  />
                </FormField>

                {DIVISIONS ? (
                  <FormField
                    className="w-full"
                    errorMessage={errors.divisions as string}
                    label={t("divisions")}
                  >
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
                ) : null}
              </FormRow>

              <FormRow>
                <ValueSelectField
                  isOptional
                  isDisabled={isDisabled}
                  isClearable
                  label={t("situationCode")}
                  fieldName="situationCode"
                  values={codes10.values}
                  valueType={ValueType.CODES_10}
                  filterFn={(value) => value.type === StatusValueType.SITUATION_CODE}
                />

                <ValueSelectField
                  isOptional
                  isDisabled={isDisabled}
                  isClearable
                  label={t("type")}
                  fieldName="type"
                  values={callType.values}
                  valueType={ValueType.CALL_TYPE}
                />
              </FormRow>

              <FormField errorMessage={errors.description} label={common("description")}>
                <Editor
                  value={values.descriptionData}
                  onChange={(v) => setFieldValue("descriptionData", v)}
                  isReadonly={isDisabled}
                />
              </FormField>

              {call ? <AssignedUnitsTable isDisabled={isDisabled} /> : null}
            </>
          )}

          <footer className={`mt-5 flex ${call ? "justify-between" : "justify-end"}`}>
            {call ? (
              <Button onPress={handleEndClick} type="button" variant="danger" disabled={isDisabled}>
                {t("endCall")}
              </Button>
            ) : null}

            <div className="flex items-center">
              {call ? (
                <FormField
                  className="!mb-0"
                  labelClassName="min-w-fit"
                  label="Notify assigned units"
                  checkbox
                >
                  <Input
                    checked={values.notifyAssignedUnits}
                    onChange={() =>
                      setFieldValue("notifyAssignedUnits", !values.notifyAssignedUnits)
                    }
                    type="checkbox"
                  />
                </FormField>
              ) : !isCitizen ? (
                <FormField
                  className="!mb-0"
                  labelClassName="min-w-fit"
                  label="Open Manage 911 call modal after call creation?"
                  checkbox
                >
                  <Input
                    checked={values.openCallModalAfterCreation}
                    onChange={() =>
                      setFieldValue(
                        "openCallModalAfterCreation",
                        !values.openCallModalAfterCreation,
                      )
                    }
                    type="checkbox"
                  />
                </FormField>
              ) : null}

              <Button className="ml-2" onPress={handleClose} type="button" variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                variant={call?.status === WhitelistStatus.PENDING ? "cancel" : "default"}
                disabled={isDisabled || state === "loading"}
                className="flex items-center ml-2"
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}

                {call ? common("save") : common("create")}
              </Button>

              {call?.status === WhitelistStatus.PENDING ? (
                <Button
                  disabled={isDisabled || state === "loading"}
                  className="flex items-center ml-2"
                  type="button"
                  onClick={() => {
                    setFieldValue("status", WhitelistStatus.ACCEPTED);
                    handleSubmit();
                  }}
                >
                  {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}

                  {t("saveAndAccept")}
                </Button>
              ) : null}
            </div>
          </footer>
        </Form>
      )}
    </Formik>
  );
}
