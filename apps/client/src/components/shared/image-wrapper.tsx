import * as React from "react";
import Image, { type ImageProps } from "next/image";

interface Props extends ImageProps {
  fallback?: React.ReactNode;
}

export function ImageWrapper(props: Props) {
  const fallback = (props.fallback ?? null) as React.JSX.Element;
  const [hasError, setHasError] = React.useState(false);

  return hasError ? fallback : <Image {...props} onError={() => setHasError(true)} />;
}
