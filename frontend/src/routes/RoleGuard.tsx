import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

const STAFF_REDIRECTS: Record<string, string> = {
  DESIGN: "/design-queue",
  PRINTING: "/print-queue",
  SHIPPING: "/shipping-queue",
  ADMIN: "/admin",
};

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a" }}>
        <div style={{ color: "#e05c1a", fontSize: 18 }}>Loading…</div>
      </div>
    );
  }

  // Unauthenticated → send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but wrong role → redirect to their correct queue
  if (!roles.includes(user.role)) {
    const dest = STAFF_REDIRECTS[user.role] ?? "/";
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
}
