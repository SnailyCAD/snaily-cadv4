type Props = JSX.IntrinsicElements["button"] & {
  small?: boolean;
  variant?: keyof typeof variants;
};

const variants = {
  small: "p-0.5 px-2",
  cancel: "bg-transparent hover:bg-transparent text-gray-800",
  danger: "bg-red-500 hover:bg-red-600",
  success: "bg-green-500 hover:bg-green-500",
};

export const Button = ({ className, variant, ...rest }: Props) => {
  return (
    <button
      className={`
          p-1 px-4
          text-white bg-gray-500 rounded-md transition-all
          disabled:opacity-60 disabled:cursor-not-allowed
          hover:bg-gray-600
          ${variant ? variants[variant] : ""} ${className}
      `}
      {...rest}
    />
  );
};
