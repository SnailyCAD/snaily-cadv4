import { ExclamationTriangleFill } from "react-bootstrap-icons";

interface Props {
  errorMessageProps: any;
  errorMessage: React.ReactNode;
}

export function ErrorMessage(props: Props) {
  return (
    <span
      {...props.errorMessageProps}
      className="h-full flex items-start gap-1 mt-1 font-medium text-red-500"
    >
      <ExclamationTriangleFill className="mt-1.5 mr-1" aria-hidden="true" />
      {props.errorMessage}
    </span>
  );
}
