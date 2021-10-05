interface Props {
  className: string;
}

export const Loader = ({ className }: Props) => {
  return (
    <div className="loader">
      <span className={className} />
      <span className={className} />
      <span className={className} />
    </div>
  );
};
