type Props = JSX.IntrinsicElements["button"] & {
  small?: boolean;
};

export const Button = ({ className, small, ...rest }: Props) => {
  return (
    <button
      className={`
          ${small ? "p-0.5 px-2" : "p-1 px-4"}

          text-white bg-gray-500 rounded-md transition-all
          disabled:opacity-60 disabled:cursor-not-allowed
          hover:bg-gray-600
          ${className}
      `}
      {...rest}
    />
  );
};
