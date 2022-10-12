import * as React from "react";
import { useTranslations } from "next-intl";
import { classNames } from "../utils/classNames";
import type { FocusableElement } from "@react-types/shared";

interface Props {
  label: React.ReactNode;
  labelProps: React.DOMAttributes<FocusableElement>;
  isOptional?: boolean;
  hiddenLabel?: boolean;
  labelClassnames?: string;
  element?: keyof React.ReactHTML;
}

export function Label(props: Props) {
  const common = useTranslations("Common");
  const optionalText = common("optionalField");
  const elementType = props.element ?? "label";

  const element = React.createElement(
    elementType,
    {
      ...props.labelProps,
      className: classNames(
        "mb-1 dark:text-white",
        props.hiddenLabel && "sr-only",
        props.labelClassnames,
      ),
    },
    <>
      {props.label}{" "}
      {props.isOptional ? <span className="text-sm italic">({optionalText})</span> : null}
    </>,
  );

  return element;
}
