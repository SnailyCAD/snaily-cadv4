type Props = JSX.IntrinsicElements["button"] & {
  small?: boolean;
};

export const Button = ({ className, small, ...rest }: Props) => {
  return (
    <button
      className={`
          ${small ? "p-0.5 px-2" : "p-1 px-4"}

          bg-white dark:bg-black rounded-md
          text-dark-gray dark:text-white
          border-[1.2px] hover:border-dark-gray dark:hover:border-white dark:border-gray-800
          border-gray-300 transition-all
          disabled:opacity-60 disabled:cursor-not-allowed

          ${className}
      `}
      {...rest}
    />
  );
};
