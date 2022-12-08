import { AriaBreadcrumbItemProps, useBreadcrumbItem } from "@react-aria/breadcrumbs";
import * as React from "react";
import { classNames } from "../../utils/classNames";
import Link from "next/link";
import { ChevronRight } from "react-bootstrap-icons";

interface Props extends AriaBreadcrumbItemProps {
  href?: string;
}

export function BreadcrumbItem(props: Props) {
  return (
    <li className="flex items-center">
      {!props.href || props.isCurrent ? <SpanElement {...props} /> : <LinkElement {...props} />}
      {!props.isCurrent && (
        <span aria-hidden="true" className="inline-block p-1">
          <ChevronRight className="h-3 w-3" />
        </span>
      )}
    </li>
  );
}

function SpanElement(props: Props) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const { itemProps } = useBreadcrumbItem({ ...props, elementType: "span" }, ref);

  return (
    <span
      {...itemProps}
      ref={ref}
      className={classNames(
        "cursor-default",
        props.isDisabled ? "text-gray-400" : "text-blue-500",
        props.isCurrent ? "font-semibold" : "font-normal",
      )}
    >
      {props.children}
    </span>
  );
}

function LinkElement(props: Props) {
  const ref = React.useRef<HTMLAnchorElement | null>(null);
  const { itemProps } = useBreadcrumbItem({ ...props, elementType: "a" }, ref);

  return (
    <Link
      {...itemProps}
      ref={ref}
      className={classNames(
        props.isDisabled ? "text-gray-400" : "text-blue-500",
        !props.isCurrent && "hover:text-blue-600",
        props.isCurrent || props.isDisabled ? "no-underline" : "underline",
        props.isCurrent ? "font-semibold" : "font-normal",
        props.isCurrent || props.isDisabled ? "cursor-default" : "cursor-pointer",
      )}
      href={props.href || "#"}
    >
      {props.children}
    </Link>
  );
}
