import DashBoardLayoutProvider from "@/provider/dashboard.layout.provider";
import AuthGuard from "@/components/auth/auth-guard";

const layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <DashBoardLayoutProvider>{children}</DashBoardLayoutProvider>
    </AuthGuard>
  );
};

export default layout;