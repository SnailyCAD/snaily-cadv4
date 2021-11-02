import { Layout } from "components/Layout";
import { AdminSidebar } from "./Sidebar";

interface Props {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: Props) => {
  return (
    <Layout className="relative z-10 flex min-h-screen">
      <div className="w-60">
        <AdminSidebar />
      </div>

      <div className="w-full ml-4">{children}</div>
    </Layout>
  );
};
