import * as React from "react";
import { AriaBreadcrumbsProps, useBreadcrumbs } from "@react-aria/breadcrumbs";

interface Props extends AriaBreadcrumbsProps {
  children: React.ReactNode;
}

export function Breadcrumbs(props: Props) {
  const { navProps } = useBreadcrumbs(props);
  const children = React.Children.toArray(props.children);

  return (
    <nav {...navProps} className="mb-3">
      <ol className="flex list-none">
        {children.map((child, i) =>
          React.cloneElement(child as React.ReactElement, { isCurrent: i === children.length - 1 }),
        )}
      </ol>
    </nav>
  );
}
