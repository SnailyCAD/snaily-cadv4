import { Form, Formik } from "formik";
import { useTranslations } from "use-intl";
import { LICENSE_SCHEMA } from "@snailycad/schemas";
import { useModal } from "state/modalState";
import { Modal } from "components/modal/Modal";
import { ModalIds } from "types/ModalIds";
import type { SelectValue } from "components/form/Select";
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
  suspended: Omit<SuspendedCitizenLicenses, "id">;

  driversLicenseCategory: SelectValue[] | null;
  pilotLicenseCategory: SelectValue[] | null;
  waterLicenseCategory: SelectValue[] | null;
  firearmLicenseCategory: SelectValue[] | null;
}

export function ManageLicensesModal({
  state,
  citizen,
  isLeo,
  allowRemoval = true,
  onSubmit,
}: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Citizen");

  const validate = handleValidate(LICENSE_SCHEMA);
  const INITIAL_VALUES: LicenseInitialValues = createDefaultLicensesValues(citizen);

  return (
    <Modal
      title={t("manageLicenses")}
      isOpen={isOpen(ModalIds.ManageLicenses)}
      onClose={() => closeModal(ModalIds.ManageLicenses)}
      className="w-[750px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ isValid }) => (
          <>
            <ManageLicensesFormFields flexType="row" allowRemoval={allowRemoval} isLeo={isLeo} />

            <Form>
              <footer className="flex justify-end mt-5">
                <Button
                  type="reset"
                  onPress={() => closeModal(ModalIds.ManageLicenses)}
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
