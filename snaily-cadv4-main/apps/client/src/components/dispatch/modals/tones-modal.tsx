import { Loader, Button, TextField, SwitchField, FormRow } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, type FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { handleValidate } from "lib/handleValidate";
import { TONES_SCHEMA } from "@snailycad/schemas";
import { toastMessage } from "lib/toastMessage";
import type { DeleteDispatchTonesData, PostDispatchTonesData } from "@snailycad/types/api";
import { useGetActiveTone } from "hooks/global/use-tones";
import { Table, useTableState } from "components/shared/Table";
import { CallDescription } from "../active-calls/CallDescription";
import { type ActiveTone, ActiveToneType } from "@snailycad/types";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  types: ActiveToneType[];
}

export function TonesModal({ types }: Props) {
  const { state, execute } = useFetch();
  const modalState = useModal();

  const { activeTones } = useGetActiveTone();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const tableState = useTableState();
  const queryClient = useQueryClient();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute<PostDispatchTonesData>({
      path: "/dispatch/tones",
      method: "POST",
      data: values,
    });

    if (json) {
      toastMessage({
        message: t("toneSuccess"),
        icon: "success",
      });

      helpers.resetForm();
      await queryClient.resetQueries({ queryKey: ["active-tones"] });
    }
  }

  async function handleRevoke(id: string, resetForm: () => void) {
    const { json } = await execute<DeleteDispatchTonesData>({
      path: `/dispatch/tones/${id}`,
      method: "DELETE",
    });

    if (json) {
      await queryClient.resetQueries({ queryKey: ["active-tones"] });
      resetForm();

      toastMessage({
        message: t("toneRevokedText"),
        title: t("toneRevoked"),
        icon: "success",
      });
    }
  }

  function handleEditClick(tone: ActiveTone, setValues: any) {
    const isShared = tone.type === ActiveToneType.SHARED;

    setValues({
      emsFdTone: tone.type === ActiveToneType.EMS_FD || isShared,
      leoTone: tone.type === ActiveToneType.LEO || isShared,
      description: tone.description,
    });
  }

  const validate = handleValidate(TONES_SCHEMA);
  const INITIAL_VALUES = {
    emsFdTone: Boolean(types.every((v) => v === ActiveToneType.EMS_FD)),
    leoTone: Boolean(types.every((v) => v === ActiveToneType.LEO)),
    description: "",
    types,
  };

  return (
    <Modal
      isOpen={modalState.isOpen(ModalIds.Tones)}
      onClose={() => modalState.closeModal(ModalIds.Tones)}
      title={t("tones")}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, setValues, resetForm, values, errors, isValid }) => (
          <Form>
            <p className="my-3 text-neutral-700 dark:text-gray-400">{t("notesInfo")}</p>

            <FormRow useFlex>
              {types.includes(ActiveToneType.EMS_FD) ? (
                <SwitchField
                  className="mt-3 w-full"
                  isSelected={values.emsFdTone}
                  onChange={(isSelected) => setFieldValue("emsFdTone", isSelected)}
                >
                  {t("emsFdTone")}
                </SwitchField>
              ) : null}

              {types.includes(ActiveToneType.LEO) ? (
                <SwitchField
                  className="mt-3 w-full"
                  isSelected={values.leoTone}
                  onChange={(isSelected) => setFieldValue("leoTone", isSelected)}
                >
                  {t("leoTone")}
                </SwitchField>
              ) : null}
            </FormRow>

            <TextField
              isTextarea
              errorMessage={errors.description}
              label={common("description")}
              autoFocus
              name="description"
              onChange={(value) => setFieldValue("description", value)}
              value={values.description}
            />

            <section>
              <h3 className="font-semibold text-xl mb-3">{t("manageTones")}</h3>

              {activeTones.length <= 0 ? (
                <p className="text-neutral-700 dark:text-gray-400">{t("noExistingTones")}</p>
              ) : (
                <Table
                  features={{ isWithinCardOrModal: true }}
                  tableState={tableState}
                  columns={[
                    { header: common("type"), accessorKey: "type" },
                    { header: common("description"), accessorKey: "description" },
                    { header: common("actions"), accessorKey: "actions" },
                  ]}
                  data={activeTones.map((tone) => ({
                    id: tone.id,
                    type: tone.type,
                    description: <CallDescription data={tone} />,
                    actions: (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="xs"
                          variant="danger"
                          onPress={() => handleRevoke(tone.id, resetForm)}
                        >
                          {common("revoke")}
                        </Button>

                        <Button
                          type="button"
                          size="xs"
                          variant="success"
                          onPress={() => handleEditClick(tone, setValues)}
                        >
                          {common("edit")}
                        </Button>
                      </div>
                    ),
                  }))}
                />
              )}
            </section>

            <footer className="flex justify-end gap-2">
              <Button
                variant="cancel"
                onPress={() => modalState.closeModal(ModalIds.Tones)}
                className="flex items-center"
                type="reset"
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("sendTone")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
