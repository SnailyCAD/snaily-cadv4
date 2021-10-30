import { Nav } from "components/Nav";
import { AdminSidebar } from "./Sidebar";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const AdminLayout = ({ className, children }: Props) => {
  return (
    <>
      <Nav />

      <main
        className={`relative z-10 mt-5 px-4 pb-5 container max-w-6xl mx-auto flex  ${className}`}
      >
        <div className="w-60">
          <AdminSidebar />
        </div>

        <div className="w-full ml-2">{children}</div>
      </main>
    </>
  );
};
