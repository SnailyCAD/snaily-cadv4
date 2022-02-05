import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input, PasswordInput } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { useAuth } from "context/AuthContext";

enum Steps {
  EnterPassword = 0,
  ScanQRCode = 1,
  VerifyCode = 2,
}

export function Manage2FAModal() {
  const { setUser, user } = useAuth();
  const [currentStep, setCurrentStep] = React.useState(Steps.EnterPassword);
  const [dataUri, setDataUri] = React.useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = React.useState("");

  const common = useTranslations("Common");
  const t = useTranslations("Account");
  const { isOpen, closeModal, getPayload } = useModal();
  const shouldDisable = getPayload<boolean>(ModalIds.Manage2FA);

  const { state, execute } = useFetch();

  async function onCancel() {
    if (currentStep !== Steps.EnterPassword) {
      await execute("/2fa", {
        method: "DELETE",
        data: { currentPassword },
      });
    }

    reset();
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (currentStep === Steps.EnterPassword) {
      if (shouldDisable) {
        const { json } = await execute("/2fa", {
          method: "DELETE",
          data: { currentPassword },
          helpers,
        });

        if (typeof json === "boolean" && json) {
          setUser({ ...user!, twoFactorEnabled: false });
          closeModal(ModalIds.Manage2FA);
        }

        return;
      }

      const { json } = await execute("/2fa/enable", {
        method: "POST",
        data: values,
        helpers,
      });

      if (typeof json === "string") {
        setCurrentStep(Steps.ScanQRCode);
        setDataUri(json);
      }
    }

    if (currentStep === Steps.ScanQRCode) {
      setCurrentStep(Steps.VerifyCode);
    }

    if (currentStep === Steps.VerifyCode) {
      const { json } = await execute("/2fa/verify", {
        method: "POST",
        data: values,
        helpers,
      });

      if (typeof json === "boolean" && json) {
        setUser({ ...user!, twoFactorEnabled: true });
        reset();
      }
    }
  }

  function reset() {
    closeModal(ModalIds.Manage2FA);
    setCurrentStep(Steps.EnterPassword);
    setCurrentPassword("");
  }

  const INITIAL_VALUES = {
    currentPassword: "",
    totpCode: "",
  };

  return (
    <Modal
      onClose={onCancel}
      title={t("2fa")}
      isOpen={isOpen(ModalIds.Manage2FA)}
      className="w-[500px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, values, isValid, errors }) => (
          <Form>
            {currentStep === Steps.EnterPassword ? (
              <FormField errorMessage={errors.currentPassword} label={t("currentPassword")}>
                <PasswordInput
                  name="currentPassword"
                  value={values.currentPassword}
                  required
                  onChange={(e) => {
                    handleChange(e);
                    setCurrentPassword(e.currentTarget.value);
                  }}
                />
              </FormField>
            ) : null}

            {currentStep === Steps.ScanQRCode && dataUri ? (
              <div className="flex flex-col items-center">
                <p className="my-3 mb-5 dark:text-gray-300">{t("scanQRCode")}</p>

                <img
                  className="self-center"
                  width={350}
                  height={350}
                  draggable={false}
                  src={dataUri}
                />
              </div>
            ) : null}

            {currentStep === Steps.VerifyCode ? (
              <>
                <p className="my-3 mb-5 dark:text-gray-300">{t("verifyCode")}</p>

                <FormField errorMessage={errors.totpCode} label="Code">
                  <Input
                    autoFocus
                    required
                    name="totpCode"
                    value={values.totpCode}
                    onChange={handleChange}
                  />
                </FormField>
              </>
            ) : null}

            <footer className="mt-7 flex justify-end">
              <Button type="reset" onClick={onCancel} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
                variant={shouldDisable ? "danger" : "default"}
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {shouldDisable ? "Disable" : currentStep === Steps.VerifyCode ? "Verify" : "Next"}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
