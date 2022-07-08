import { Form, Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { PersonFill } from "react-bootstrap-icons";
import { useImageUrl } from "hooks/useImageUrl";
import { toastMessage } from "lib/toastMessage";
import type { NameSearchResult } from "state/search/nameSearchState";
import type { PostCreateWarrantData, PutWarrantsData } from "@snailycad/types/api";
import type { ActiveWarrant } from "state/leoState";
import { isUnitCombined } from "@snailycad/utils";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";

interface Props {
  onClose?(): void;
  warrant: ActiveWarrant | null;

  onUpdate?(previous: ActiveWarrant, newWarrant: PutWarrantsData): void;
  onCreate?(warrant: PostCreateWarrantData): void;
}

export function CreateWarrantModal({ warrant, onClose, onCreate, onUpdate }: Props) {
  const { isOpen, closeModal, getPayload } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const { makeImageUrl } = useImageUrl();
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
        onUpdate?.(warrant, json);
      }
    } else {
      const { json } = await execute<PostCreateWarrantData, typeof INITIAL_VALUES>({
        path: "/records/create-warrant",
        method: "POST",
        data,
        helpers,
      });

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
    assignedOfficers:
      warrant?.assignedOfficers && isActive
        ? warrant.assignedOfficers.map((unit) => ({
            label: isUnitCombined(unit.unit)
              ? generateCallsign(unit.unit, "pairedUnitTemplate")
              : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`,
            value: unit.id,
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
            <FormField errorMessage={errors.citizenId} label={t("citizen")}>
              <InputSuggestions<NameSearchResult>
                inputProps={{
                  value: values.citizenName,
                  name: "citizenName",
                  onChange: handleChange,
                  errorMessage: errors.citizenId,
                }}
                onSuggestionClick={(suggestion) => {
                  setFieldValue("citizenId", suggestion.id);
                  setFieldValue("citizenName", `${suggestion.name} ${suggestion.surname}`);
                }}
                options={{
                  apiPath: "/search/name",
                  dataKey: "name",
                  method: "POST",
                }}
                Component={({ suggestion }) => (
                  <div className="flex items-center">
                    <div className="mr-2 min-w-[25px]">
                      {suggestion.imageId ? (
                        <img
                          className="rounded-md w-[35px] h-[35px] object-cover"
                          draggable={false}
                          src={makeImageUrl("citizens", suggestion.imageId)}
                        />
                      ) : (
                        <PersonFill className="text-gray-500/60 w-[25px] h-[25px]" />
                      )}
                    </div>
                    <p>
                      {suggestion.name} {suggestion.surname}
                    </p>
                  </div>
                )}
              />
            </FormField>

            {isActive ? (
              <FormField label="Assigned Officers">
                <Select
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

            <FormField errorMessage={errors.status} label={t("status")}>
              <Select
                values={[
                  { label: "Active", value: "ACTIVE" },
                  { label: "Inactive", value: "INACTIVE" },
                ]}
                name="status"
                onChange={handleChange}
                value={values.status}
              />
            </FormField>

            <FormField errorMessage={errors.description} label={common("description")}>
              <Textarea name="description" onChange={handleChange} value={values.description} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
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
