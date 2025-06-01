import { Form, Formik } from "formik";
import { useTranslations } from "use-intl";
import { LICENSE_SCHEMA } from "@snailycad/schemas";
import { useModal } from "state/modalState";
import { Modal } from "components/modal/Modal";
import { ModalIds } from "types/modal-ids";
import { Button, Loader } from "@snailycad/ui";
import { handleValidate } from "lib/handleValidate";
import type { Citizen, SuspendedCitizenLicenses } from "@snailycad/types";
import { createDefaultLicensesValues, ManageLicensesFormFields } from "./ManageLicensesFormFields";

interface Props {
  onSubmit(values: LicenseInitialValues): Promise<void>;
  isLeo?: boolean;
  allowRemoval?: boolean;
  citizen: Citizen;
  state: "loading" | "error" | null;
}

export interface LicenseInitialValues {
  driversLicense: string | null;
  pilotLicense: string | null;
  weaponLicense: string | null;
  waterLicense: string | null;
  huntingLicense: string | null;
  fishingLicense: string | null;
  suspended: Omit<SuspendedCitizenLicenses, "id">;

  driversLicenseCategory: string[];
  pilotLicenseCategory: string[];
  waterLicenseCategory: string[];
  firearmLicenseCategory: string[];
  huntingLicenseCategory: string[];
  fishingLicenseCategory: string[];
  otherLicenseCategory: string[];
}

export function ManageLicensesModal({
  state,
  citizen,
  isLeo,
  allowRemoval = true,
  onSubmit,
}: Props) {
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Citizen");

  const validate = handleValidate(LICENSE_SCHEMA);
  const INITIAL_VALUES: LicenseInitialValues = createDefaultLicensesValues(citizen);

  return (
    <Modal
      title={t("manageLicenses")}
      isOpen={modalState.isOpen(ModalIds.ManageLicenses)}
      onClose={() => modalState.closeModal(ModalIds.ManageLicenses)}
      className="w-[750px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ isValid }) => (
          <>
            <ManageLicensesFormFields allowRemoval={allowRemoval} isLeo={isLeo} />

            <Form>
              <footer className="flex justify-end mt-5">
                <Button
                  type="reset"
                  onPress={() => modalState.closeModal(ModalIds.ManageLicenses)}
                  variant="cancel"
                >
                  {common("cancel")}
                </Button>
                <Button
                  className="flex items-center"
                  disabled={!isValid || state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {common("save")}
                </Button>
              </footer>
            </Form>
          </>
        )}
      </Formik>
    </Modal>
  );
}
