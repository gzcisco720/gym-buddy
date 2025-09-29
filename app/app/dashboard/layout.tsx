import DashBoardLayoutProvider from "@/provider/dashboard.layout.provider";
import AuthGuard from "@/components/auth/auth-guard";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <DashBoardLayoutProvider>{children}</DashBoardLayoutProvider>
    </AuthGuard>
  );
};

export default DashboardLayout;