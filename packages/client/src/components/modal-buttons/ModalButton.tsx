import * as React from "react";
import { useTranslations } from "next-intl";
import type { ModalButton, Args } from "./buttons";
import { Button } from "components/Button";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { useModal } from "context/ModalContext";

type ButtonProps = Pick<JSX.IntrinsicElements["button"], "name" | "type" | "title" | "disabled">;
interface Props extends ButtonProps {
  button: ModalButton;
}

export function ModalButton({ button: buttonFn, ...buttonProps }: Props) {
  const t = useTranslations();
  const features = useFeatureEnabled();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { openModal } = useModal();

  const btnArgs = { features, hasActiveDispatchers };
  const button = buttonFn(btnArgs as Args<any>);
  const isEnabled = button.isEnabled ?? true;

  if (!isEnabled) {
    return null;
  }

  return (
    <Button
      id={button.nameKey[1]}
      disabled={buttonProps.disabled}
      title={buttonProps.disabled ? "Go on-duty before continuing" : t(button.nameKey.join("."))}
      onClick={() => openModal(button.modalId)}
      type="button"
      {...buttonProps}
    >
      {t(button.nameKey.join("."))}
    </Button>
  );
}
