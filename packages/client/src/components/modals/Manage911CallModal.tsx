import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Form, Formik, FormikHelpers } from "formik";
import { Input } from "components/form/Input";
import { FormField } from "components/form/FormField";
import { Error } from "components/form/Error";
import { Textarea } from "components/form/Textarea";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { Full911Call, useDispatchState } from "state/dispatchState";
import { useRouter } from "next/router";
import { useAuth } from "context/AuthContext";
import format from "date-fns/format";
import { Select, SelectValue } from "components/form/Select";
import { AlertModal } from "components/modal/AlertModal";
import compareDesc from "date-fns/compareDesc";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";

interface Props {
  call: Full911Call | null;
  onClose?: () => void;
}

export const Manage911CallModal = ({ call, onClose }: Props) => {
  const { isOpen, closeModal, openModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { state, execute } = useFetch();
  const { setCalls, calls } = useDispatchState();
  const router = useRouter();
  const { user } = useAuth();
  const isDispatch = router.pathname === "/dispatch" && user?.isDispatch;
  const { allOfficers, activeOfficers } = useDispatchState();

  useListener(
    SocketEvents.AddCallEvent,
    (event) => {
      if (!call) return;

      call.events.push(event);

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

  async function onEventSubmit(values: { description: string }, helpers: FormikHelpers<any>) {
    if (!call) return;

    await execute(`/911-calls/events/${call.id}`, {
      method: "POST",
      data: values,
    });

    helpers.resetForm();
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
        data: values,
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
      call?.assignedUnits.map((officer) => ({
        label: makeLabel(officer.id),
        value: officer.id,
      })) ?? ([] as SelectValue[]),
  };

  function makeLabel(value: string) {
    const officer = allOfficers.find((v) => v.id === value);
    return `${officer?.callsign} ${officer?.name} (${officer?.department?.value})`;
  }

  return (
    <Modal
      isOpen={isOpen(ModalIds.Manage911Call)}
      onClose={handleClose}
      title={"Manage 911 Call"}
      className={call ? "min-w-[850px]" : "min-w-[650px]"}
    >
      <div className="flex flex-col md:flex-row">
        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, values, errors }) => (
            <Form className="w-full">
              <FormField label="name">
                <Input id="name" value={values.name} onChange={handleChange} />
                <Error>{errors.name}</Error>
              </FormField>

              <FormField label="location">
                <Input id="location" value={values.location} onChange={handleChange} />
                <Error>{errors.location}</Error>
              </FormField>

              <FormField label="description">
                <Textarea
                  id="description"
                  className="min-h-[5em]"
                  value={values.description}
                  onChange={handleChange}
                />
                <Error>{errors.description}</Error>
              </FormField>

              {isDispatch ? (
                <FormField label="assignedUnits">
                  <Select
                    isMulti
                    name="assignedUnits"
                    value={values.assignedUnits.map((value) => ({
                      label: makeLabel(value.value),
                      value: value.value,
                    }))}
                    values={activeOfficers.map((officer) => ({
                      label: `${officer.callsign} ${officer.name} (${officer.department?.value})`,
                      value: officer.id,
                    }))}
                    onChange={handleChange}
                  />
                  <Error>{errors.assignedUnits}</Error>
                </FormField>
              ) : null}

              <footer className="mt-5 flex justify-between">
                <Button
                  onClick={() => openModal(ModalIds.AlertEnd911Call)}
                  type="button"
                  variant="danger"
                >
                  {state === "loading" ? <Loader className="border-red-200 mr-2" /> : null}
                  {t("endCall")}
                </Button>

                <div className="flex">
                  <Button onClick={handleClose} type="button" variant="cancel">
                    {common("cancel")}
                  </Button>
                  <Button className="ml-2 flex items-center" type="submit">
                    {state === "loading" ? <Loader className="border-red-200 mr-2" /> : null}

                    {call ? common("save") : common("create")}
                  </Button>
                </div>
              </footer>
            </Form>
          )}
        </Formik>

        {call ? (
          <div className="w-96 ml-2 relative">
            <h4 className="font-semibold text-xl">{common("events")}</h4>

            <ul className="overflow-auto h-[210px]">
              {(call?.events.length ?? 0) <= 0 ? (
                <p className="mt-2">{t("noEvents")}</p>
              ) : (
                call?.events
                  .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
                  .map((event) => {
                    const formatted = format(new Date(event.createdAt), "HH:mm:ss");

                    return (
                      <li key={event.id}>
                        <span className="select-none text-gray-800 mr-1 font-semibold">
                          {formatted}:
                        </span>
                        <span>{event.description}</span>
                      </li>
                    );
                  })
              )}
            </ul>

            <Formik onSubmit={onEventSubmit} initialValues={{ description: "" }}>
              {({ handleChange, values, errors }) => (
                <Form className="absolute bottom-0 w-full">
                  <FormField label="description">
                    <Textarea
                      required
                      id="description"
                      value={values.description}
                      onChange={handleChange}
                    />
                    <Error>{errors.description}</Error>
                  </FormField>

                  <footer className="mt-5 flex justify-end">
                    <Button className="ml-2 flex items-center" type="submit">
                      {state === "loading" ? <Loader className="border-red-200 mr-2" /> : null}

                      {t("addEvent")}
                    </Button>
                  </footer>
                </Form>
              )}
            </Formik>
          </div>
        ) : null}
      </div>

      <AlertModal
        id={ModalIds.AlertEnd911Call}
        title={t("end911Call")}
        description={t("alert_end911Call")}
        onDeleteClick={handleDelete}
        deleteText={t("endCall")}
      />
    </Modal>
  );
};
