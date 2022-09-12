import { useRouter } from "next/router";
import type { Post911CallsData, Put911CallByIdData } from "@snailycad/types/api";
import { StatusValueType } from "@snailycad/types";
import { FormRow } from "components/form/FormRow";
import { handleValidate } from "lib/handleValidate";
import { CALL_911_SCHEMA } from "@snailycad/schemas";
import { dataToSlate, Editor } from "components/editor/Editor";
import { useValues } from "context/ValuesContext";
import { toastMessage } from "lib/toastMessage";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { Input } from "components/form/inputs/Input";
import { FormField } from "components/form/FormField";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import type { Full911Call } from "state/dispatch/dispatchState";
import { Select } from "components/form/Select";
import { Button } from "components/Button";
import { useTranslations } from "next-intl";
import { useCall911State } from "state/dispatch/call911State";
import { useModal } from "state/modalState";
import { AssignedUnitsTable } from "./AssignedUnitsTable";

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
  const { setCalls, calls } = useCall911State();
  const { closeModal } = useModal();

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
    assignedUnits: undefined,
  };

  return (
    <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
      {({ handleChange, setFieldValue, values, errors }) => (
        <Form className="w-full h-full">
          <FormField errorMessage={errors.name} label={common("name")}>
            <Input disabled={isDisabled} name="name" value={values.name} onChange={handleChange} />
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

                <FormField errorMessage={errors.type} label={t("type")}>
                  <Select
                    isClearable
                    name="type"
                    value={values.type}
                    values={callType.values.map((callType) => ({
                      label: callType.value.value,
                      value: callType.id,
                    }))}
                    onChange={handleChange}
                    disabled={isDisabled}
                  />
                </FormField>
              </FormRow>

              <FormField
                className="max-w-[750px]"
                errorMessage={errors.description}
                label={common("description")}
              >
                <Editor
                  value={values.descriptionData}
                  onChange={(v) => setFieldValue("descriptionData", v)}
                  isReadonly={isDisabled}
                />
              </FormField>

              {call ? <AssignedUnitsTable /> : null}
            </>
          )}

          <footer className={`mt-5 flex ${call ? "justify-between" : "justify-end"}`}>
            {call ? (
              <Button onClick={handleEndClick} type="button" variant="danger" disabled={isDisabled}>
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
  );
}
