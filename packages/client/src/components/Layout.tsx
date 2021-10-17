import { Nav } from "./Nav";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const Layout = ({ children, className = "" }: Props) => {
  return (
    <>
      <Nav maxWidth={className.split(" ").find((v) => v.startsWith("max-w"))} />

      <main className={`mt-5 px-4 container max-w-6xl mx-auto ${className}`}>{children}</main>
    </>
  );
};
