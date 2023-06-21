import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "mxcn";
import type { FocusableElement } from "@react-types/shared";
import { InfoCircle } from "react-bootstrap-icons";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

interface Props {
  label: React.ReactNode;
  labelProps: React.DOMAttributes<FocusableElement>;
  isOptional?: boolean;
  hiddenLabel?: boolean;
  labelClassnames?: string;
  element?: keyof React.ReactHTML;
  description?: React.ReactNode;
}

export function Label(props: Props) {
  const common = useTranslations("Common");
  const optionalText = common("optionalField");
  const elementType = props.element ?? "label";

  const element = React.createElement(
    elementType,
    {
      ...props.labelProps,
      className: cn(
        "mb-1 dark:text-white flex items-center gap-1",
        props.hiddenLabel && "sr-only",
        props.labelClassnames,
      ),
    },
    <>
      {props.label}{" "}
      {props.isOptional ? <span className="text-sm italic">({optionalText})</span> : null}
      {props.description ? (
        <span className="ml-1">
          <HoverCard>
            <HoverCardTrigger asChild>
              <InfoCircle width={14} height={14} />
            </HoverCardTrigger>

            <HoverCardContent pointerEvents>{props.description}</HoverCardContent>
          </HoverCard>
        </span>
      ) : null}
    </>,
  );

  return element;
}
