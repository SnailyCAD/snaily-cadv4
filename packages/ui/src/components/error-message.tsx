import { ExclamationTriangleFill } from "react-bootstrap-icons";

interface Props {
  errorMessageProps: any;
  errorMessage: React.ReactNode;
}

export function ErrorMessage(props: Props) {
  return (
    <span
      {...props.errorMessageProps}
      className="flex items-center gap-1 mt-1 font-medium text-red-500"
    >
      <ExclamationTriangleFill aria-hidden="true" />
      {props.errorMessage}
    </span>
  );
}
