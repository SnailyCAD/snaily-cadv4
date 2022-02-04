import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { Input } from "components/form/inputs/Input";
import { FormField } from "components/form/FormField";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { Full911Call, FullDeputy, useDispatchState } from "state/dispatchState";
import { useRouter } from "next/router";
import { useAuth } from "context/AuthContext";
import { Select, SelectValue } from "components/form/Select";
import { AlertModal } from "components/modal/AlertModal";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { CallEventsArea } from "./911Call/EventsArea";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import type { CombinedLeoUnit } from "@snailycad/types";
import { FormRow } from "components/form/FormRow";
import { handleValidate } from "lib/handleValidate";
import { CREATE_911_CALL } from "@snailycad/schemas";
import { dataToSlate, Editor } from "components/modal/DescriptionModal/Editor";
import { useValues } from "context/ValuesContext";

interface Props {
  call: Full911Call | null;
  setCall?: React.Dispatch<React.SetStateAction<Full911Call | null>>;
  onClose?(): void;
}

export function Manage911CallModal({ setCall, call, onClose }: Props) {
  const { isOpen, closeModal, openModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { state, execute } = useFetch();
  const { setCalls, calls } = useDispatchState();
  const router = useRouter();
  const { user } = useAuth();
  const isDispatch = router.pathname.startsWith("/dispatch") && user?.isDispatch;
  const { allOfficers, allDeputies, activeDeputies, activeOfficers } = useDispatchState();
  const generateCallsign = useGenerateCallsign();
  const { department, division } = useValues();
  const isDisabled = !router.pathname.includes("/citizen") && !isDispatch;

  const allUnits = [...allOfficers, ...allDeputies] as (FullDeputy | CombinedLeoUnit)[];
  const units = [...activeOfficers, ...activeDeputies] as (FullDeputy | CombinedLeoUnit)[];

  useListener(
    SocketEvents.AddCallEvent,
    (event) => {
      if (!call) return;

      setCall?.({
        ...call,
        events: [event, ...call.events],
      });

      setCalls(
        calls.map((c) => {
          if (c.id === call.id) {
            return { ...c, events: [event, ...c.events] };
          }

          return c;
        }),
      );
    },
    [call, calls, setCalls],
  );

  useListener(
    SocketEvents.UpdateCallEvent,
    (event) => {
      if (!call) return;

      function update(c: Full911Call) {
        if (c.id === call?.id) {
          return {
            ...c,
            events: c.events.map((ev) => {
              if (ev.id === event.id) {
                return event;
              }

              return ev;
            }),
          };
        }

        return c;
      }

      setCall?.((p) => ({
        ...(p ?? call),
        events: update(p ?? call).events,
      }));

      setCalls(
        calls.map((c) => {
          if (c.id === call.id) {
            return update(c);
          }

          return c;
        }),
      );
    },
    [call, calls, setCalls],
  );

  useListener(
    SocketEvents.DeleteCallEvent,
    (event) => {
      if (!call) return;

      setCall?.((p) => ({
        ...(p ?? call),
        events: (p ?? call).events.filter((v) => v.id !== event.id),
      }));

      setCalls(
        calls.map((c) => {
          if (c.id === call.id) {
            return { ...c, events: c.events.filter((v) => v.id !== event.id) };
          }

          return c;
        }),
      );
    },
    [call, calls, setCalls],
  );

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.Manage911Call);
  }

  async function handleDelete() {
    if (!call || isDisabled) return;

    const { json } = await execute(`/911-calls/${call.id}`, {
      method: "DELETE",
    });

    if (json) {
      closeModal(ModalIds.AlertEnd911Call);
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
        setCalls(
          calls.map((c) => {
            if (c.id === json.id) {
              return json;
            }

            return c;
          }),
        );
        closeModal(ModalIds.Manage911Call);
      }
    } else {
      const { json } = await execute("/911-calls", {
        method: "POST",
        data: requestData,
      });

      if (json.id) {
        setCalls([json, ...calls]);
        closeModal(ModalIds.Manage911Call);
      }
    }
  }

  const validate = handleValidate(CREATE_911_CALL);
  const INITIAL_VALUES = {
    name: call?.name ?? "",
    location: call?.location ?? "",
    postal: call?.postal ?? "",
    description: call?.description ?? "",
    descriptionData: dataToSlate(call),
    departments: call?.departments?.map((dep) => ({ value: dep.id, label: dep.value.value })) ?? [],
    divisions: call?.divisions?.map((dep) => ({ value: dep.id, label: dep.value.value })) ?? [],
    assignedUnits:
      call?.assignedUnits.map((unit) => ({
        label: makeLabel(unit.unit.id),
        value: unit.unit.id,
      })) ?? ([] as SelectValue[]),
  };

  function makeLabel(value: string) {
    const unit = allUnits.find((v) => v.id === value) ?? units.find((v) => v.id === value);

    if (unit && "officers" in unit) {
      return `${unit.callsign}`;
    }

    return unit ? `${generateCallsign(unit)} ${makeUnitName(unit)}` : "";
  }

  return (
    <Modal
      isOpen={isOpen(ModalIds.Manage911Call)}
      onClose={handleClose}
      title={call ? "Manage 911 Call" : t("create911Call")}
      className={call ? "w-[1200px]" : "w-[650px]"}
    >
      <div className="flex flex-col md:flex-row">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, setFieldValue, values, errors }) => (
            <Form className="w-full">
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
                    onClick={() => openModal(ModalIds.AlertEnd911Call)}
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

        {call ? <CallEventsArea disabled={isDisabled} call={call} /> : null}
      </div>

      {call ? (
        <AlertModal
          id={ModalIds.AlertEnd911Call}
          title={t("end911Call")}
          description={t("alert_end911Call")}
          onDeleteClick={handleDelete}
          deleteText={t("endCall")}
        />
      ) : null}
    </Modal>
  );
}
