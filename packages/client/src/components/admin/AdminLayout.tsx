import { Layout } from "components/Layout";
import { classNames } from "lib/classNames";
import { AdminSidebar } from "./Sidebar";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const AdminLayout = ({ children, className }: Props) => {
  return (
    <Layout className={classNames("relative z-10 flex", className)}>
      <div className="w-60">
        <AdminSidebar />
      </div>

      <div className="w-full ml-4">{children}</div>
    </Layout>
  );
};
