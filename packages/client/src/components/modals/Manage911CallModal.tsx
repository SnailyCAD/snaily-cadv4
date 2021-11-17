import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Form, Formik } from "formik";
import { Input } from "components/form/Input";
import { FormField } from "components/form/FormField";
import { Error } from "components/form/Error";
import { Textarea } from "components/form/Textarea";
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
import type { CombinedLeoUnit } from "types/prisma";

interface Props {
  call: Full911Call | null;
  setCall?: React.Dispatch<React.SetStateAction<Full911Call | null>>;
  onClose?: () => void;
}

export const Manage911CallModal = ({ setCall, call, onClose }: Props) => {
  const { isOpen, closeModal, openModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { state, execute } = useFetch();
  const { setCalls, calls } = useDispatchState();
  const router = useRouter();
  const { user } = useAuth();
  const isDispatch = router.pathname === "/dispatch" && user?.isDispatch;
  const { allOfficers, allDeputies, activeDeputies, activeOfficers } = useDispatchState();
  const generateCallsign = useGenerateCallsign();

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
    if (!call) return;

    const { json } = await execute(`/911-calls/${call.id}`, {
      method: "DELETE",
    });

    if (json) {
      closeModal(ModalIds.AlertEnd911Call);
      closeModal(ModalIds.Manage911Call);
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (call) {
      const { json } = await execute(`/911-calls/${call.id}`, {
        method: "PUT",
        data: { ...values, assignedUnits: values.assignedUnits.map(({ value }) => value) },
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
        data: { ...values, assignedUnits: values.assignedUnits.map(({ value }) => value) },
      });

      if (json.id) {
        setCalls([json, ...calls]);
        closeModal(ModalIds.Manage911Call);
      }
    }
  }

  const INITIAL_VALUES = {
    name: call?.name ?? "",
    location: call?.location ?? "",
    description: call?.description ?? "",
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

    return unit ? `${generateCallsign(unit!)} ${makeUnitName(unit!)}` : "";
  }

  return (
    <Modal
      isOpen={isOpen(ModalIds.Manage911Call)}
      onClose={handleClose}
      title={call ? "Manage 911 Call" : t("create911Call")}
      className={call ? "w-[1200px]" : "w-[650px]"}
    >
      <div className="flex flex-col md:flex-row">
        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, values, errors }) => (
            <Form className="w-full">
              <FormField label={common("name")}>
                <Input id="name" value={values.name} onChange={handleChange} />
                <Error>{errors.name}</Error>
              </FormField>

              <FormField label={t("location")}>
                <Input id="location" value={values.location} onChange={handleChange} />
                <Error>{errors.location}</Error>
              </FormField>

              <FormField label={common("description")}>
                <Textarea
                  id="description"
                  className="min-h-[5em]"
                  value={values.description}
                  onChange={handleChange}
                />
                <Error>{errors.description}</Error>
              </FormField>

              {isDispatch ? (
                <FormField label={t("assignedUnits")}>
                  <Select
                    showContextMenuForUnits
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
                  />
                  <Error>{errors.assignedUnits}</Error>
                </FormField>
              ) : null}

              <footer className={`mt-5 flex ${call ? "justify-between" : "justify-end"}`}>
                {call ? (
                  <Button
                    onClick={() => openModal(ModalIds.AlertEnd911Call)}
                    type="button"
                    variant="danger"
                  >
                    {t("endCall")}
                  </Button>
                ) : null}

                <div className="flex">
                  <Button onClick={handleClose} type="button" variant="cancel">
                    {common("cancel")}
                  </Button>
                  <Button
                    disabled={state === "loading"}
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

        {call ? <CallEventsArea call={call} /> : null}
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
};
