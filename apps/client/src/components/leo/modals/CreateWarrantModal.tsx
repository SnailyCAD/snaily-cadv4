import { Form, Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";
import { Loader, Button, SelectField, TextField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import useFetch from "lib/useFetch";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { toastMessage } from "lib/toastMessage";
import type { PostCreateWarrantData, PutWarrantsData } from "@snailycad/types/api";
import type { ActiveWarrant } from "state/leo-state";
import { isUnitCombined } from "@snailycad/utils";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { WarrantStatus } from "@snailycad/types";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";

interface Props {
  onClose?(): void;
  warrant: ActiveWarrant | null;
  readOnly?: boolean;

  onUpdate?(newWarrant: PutWarrantsData): void;
  onCreate?(warrant: PostCreateWarrantData): void;
}

export function CreateWarrantModal({ warrant, readOnly, onClose, onCreate, onUpdate }: Props) {
  const { isOpen, closeModal, getPayload } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();
  const { activeOfficers } = useActiveOfficers();
  const { isActive } = getPayload<{ isActive: boolean }>(ModalIds.CreateWarrant) ?? {
    isActive: false,
  };

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.CreateWarrant);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const data = {
      ...values,
      assignedOfficers: values.assignedOfficers.map((value) => value.value),
    };

    if (warrant) {
      const { json } = await execute<PutWarrantsData, typeof INITIAL_VALUES>({
        path: `/records/warrant/${warrant.id}`,
        method: "PUT",
        data,
        helpers,
      });

      if (json.id) {
        closeModal(ModalIds.CreateWarrant);
        onUpdate?.(json);
      }
    } else {
      const { json, error } = await execute<PostCreateWarrantData, typeof INITIAL_VALUES>({
        path: "/records/create-warrant",
        method: "POST",
        data,
        helpers,
        noToast: "warrantApprovalRequired",
      });

      if (error === "warrantApprovalRequired") {
        toastMessage({
          title: common("success"),
          message: t("warrantCreatedButApprovalRequired"),
          icon: "success",
        });

        handleClose();
        return;
      }

      if (json.id) {
        toastMessage({
          title: common("success"),
          message: t("successCreateWarrant", { citizen: values.citizenName }),
          icon: "success",
        });

        closeModal(ModalIds.CreateWarrant);
        onCreate?.(json);
      }
    }
  }

  const INITIAL_VALUES = {
    citizenId: warrant?.citizenId ?? "",
    citizenName: warrant?.citizen ? `${warrant.citizen.name} ${warrant.citizen.surname}` : "",
    status: warrant?.status ?? "",
    description: warrant?.description ?? "",
    assignedOfficers: warrant?.assignedOfficers
      ? warrant.assignedOfficers.map((unit) => ({
          label: isUnitCombined(unit.unit)
            ? generateCallsign(unit.unit, "pairedUnitTemplate")
            : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`,
          value: unit.unit.id,
        }))
      : [],
  };

  return (
    <Modal
      title={t("createWarrant")}
      isOpen={isOpen(ModalIds.CreateWarrant)}
      onClose={handleClose}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setFieldValue, values, errors, isValid }) => (
          <Form autoComplete="off">
            <CitizenSuggestionsField
              autoFocus
              fromAuthUserOnly={false}
              label={t("citizen")}
              isDisabled={readOnly}
              labelFieldName="citizenName"
              valueFieldName="citizenId"
            />

            {isActive ? (
              <FormField label="Assigned Officers">
                <Select
                  disabled={readOnly}
                  closeMenuOnSelect={false}
                  isMulti
                  name="assignedOfficers"
                  values={activeOfficers.map((unit) => ({
                    label: isUnitCombined(unit)
                      ? generateCallsign(unit, "pairedUnitTemplate")
                      : `${generateCallsign(unit)} ${makeUnitName(unit)}`,
                    value: unit.id,
                  }))}
                  value={values.assignedOfficers}
                  onChange={handleChange}
                />
              </FormField>
            ) : null}

            <SelectField
              errorMessage={errors.status}
              isDisabled={readOnly}
              label={t("status")}
              onSelectionChange={(value) => setFieldValue("status", value)}
              options={[
                { label: "Active", value: WarrantStatus.ACTIVE },
                { label: "Inactive", value: WarrantStatus.INACTIVE },
              ]}
              selectedKey={values.status}
            />

            <TextField
              isTextarea
              errorMessage={errors.description}
              label={common("description")}
              isOptional={readOnly}
              name="description"
              onChange={(value) => setFieldValue("description", value)}
              value={values.description}
            />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={readOnly || !isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {warrant ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
