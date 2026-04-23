import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a" }}>
        <div style={{ color: "#e05c1a", fontSize: 18 }}>Loading…</div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
