import { Nav } from "./Nav";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const Layout = ({ children, className = "" }: Props) => {
  return (
    <>
      <Nav />

      <main className={`mt-5 px-4 container max-w-6xl mx-auto ${className}`}>{children}</main>
    </>
  );
};
