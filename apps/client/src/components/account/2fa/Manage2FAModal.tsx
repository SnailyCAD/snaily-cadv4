import * as React from "react";
import { Button, Loader, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { useAuth } from "context/AuthContext";
import { toastMessage } from "lib/toastMessage";
import type {
  DeleteDisable2FAData,
  PostEnable2FAData,
  PostVerify2FAData,
} from "@snailycad/types/api";

enum Steps {
  EnterPassword = 0,
  ScanQRCode = 1,
  VerifyCode = 2,
}

export function Manage2FAModal() {
  const { setUser, user } = useAuth();
  const [currentStep, setCurrentStep] = React.useState(Steps.EnterPassword);

  const [totpCode, setTotpCode] = React.useState<string | null>(null);
  const [dataUri, setDataUri] = React.useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = React.useState("");

  const common = useTranslations("Common");
  const t = useTranslations("Account");
  const { isOpen, closeModal, getPayload } = useModal();
  const shouldDisable = getPayload<boolean>(ModalIds.Manage2FA);

  const { state, execute } = useFetch();

  async function onCancel() {
    if (currentStep !== Steps.EnterPassword) {
      await execute<DeleteDisable2FAData>({
        path: "/2fa",
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
        const { json } = await execute<DeleteDisable2FAData, typeof INITIAL_VALUES>({
          path: "/2fa",
          method: "DELETE",
          data: { currentPassword },
          helpers,
        });

        if (typeof json === "boolean" && json) {
          setUser({ ...user!, twoFactorEnabled: false });
          closeModal(ModalIds.Manage2FA);
          toastMessage({
            title: common("success"),
            message: t("disable2faSuccess"),
            icon: "success",
          });
        }

        return;
      }

      const { json } = await execute<PostEnable2FAData, typeof INITIAL_VALUES>({
        path: "/2fa/enable",
        method: "POST",
        data: values,
        helpers,
      });

      if (json.qrCode) {
        setCurrentStep(Steps.ScanQRCode);
        setDataUri(json.qrCode);
        setTotpCode(json.totpCode);
      }
    }

    if (currentStep === Steps.ScanQRCode) {
      setCurrentStep(Steps.VerifyCode);
    }

    if (currentStep === Steps.VerifyCode) {
      const { json } = await execute<PostVerify2FAData, typeof INITIAL_VALUES>({
        path: "/2fa/verify",
        method: "POST",
        data: values,
        helpers,
      });

      if (typeof json === "boolean" && json) {
        setUser({ ...user!, twoFactorEnabled: true });
        toastMessage({
          title: common("success"),
          message: t("enable2faSuccess"),
          icon: "success",
        });
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
      title={shouldDisable ? t("disable2FA") : t("enable2FA")}
      isOpen={isOpen(ModalIds.Manage2FA)}
      className="w-[500px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setFieldValue, values, isValid, errors }) => (
          <Form>
            {currentStep === Steps.EnterPassword ? (
              <TextField
                isRequired
                autoFocus
                type="password"
                name="currentPassword"
                value={values.currentPassword}
                onChange={(value) => {
                  setFieldValue("currentPassword", value);
                  setCurrentPassword(value);
                }}
                errorMessage={errors.currentPassword}
                label={t("currentPassword")}
              />
            ) : null}

            {currentStep === Steps.ScanQRCode && dataUri ? (
              <div className="flex w-full flex-col items-center">
                <p className="text-center my-3 text-base text-neutral-700 dark:text-gray-400">
                  {t("scanQRCode")}
                </p>
                <div className="my-3 flex items-center gap-2 w-full">
                  <span className="block h-[2px] bg-secondary w-full rounded-md" />
                  <span className="min-w-fit text-sm uppercase dark:text-gray-300">OR</span>
                  <span className="block h-[2px] bg-secondary w-full rounded-md" />
                </div>
                <p className="text-center text-base mb-5 text-neutral-700 dark:text-gray-400">
                  Enter the following code manually:{" "}
                  <code className="font-mono bg-secondary p-[1px] px-1.5 rounded-sm">
                    {totpCode}
                  </code>
                </p>

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
                <p className="my-3 mb-5 text-neutral-700 dark:text-gray-400">{t("verifyCode")}</p>

                <TextField
                  errorMessage={errors.totpCode}
                  label="Code"
                  autoFocus
                  isRequired
                  name="totpCode"
                  value={values.totpCode}
                  onChange={(value) => setFieldValue("totpCode", value)}
                />
              </>
            ) : null}

            <footer className="mt-7 flex justify-end">
              <Button type="reset" onPress={onCancel} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
                variant={shouldDisable ? "danger" : "default"}
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {shouldDisable
                  ? t("disable")
                  : currentStep === Steps.VerifyCode
                  ? t("verify")
                  : t("next")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
