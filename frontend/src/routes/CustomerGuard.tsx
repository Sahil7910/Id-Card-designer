import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

/**
 * CustomerGuard — protects customer-only routes (Designer, Orders).
 *
 * Allowed: CUSTOMER, ADMIN
 * Blocked: DESIGN → /design-queue, PRINTING → /print-queue, SHIPPING → /shipping-queue
 * Unauthenticated: passes through (pages handle their own auth prompts)
 */

const STAFF_REDIRECTS: Record<string, string> = {
  DESIGN: "/design-queue",
  PRINTING: "/print-queue",
  SHIPPING: "/shipping-queue",
};

interface CustomerGuardProps {
  children: React.ReactNode;
}

export default function CustomerGuard({ children }: CustomerGuardProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a" }}>
        <div style={{ color: "#e05c1a", fontSize: 18 }}>Loading…</div>
      </div>
    );
  }

  // Logged-in internal staff → redirect to their queue
  if (user && STAFF_REDIRECTS[user.role]) {
    return <Navigate to={STAFF_REDIRECTS[user.role]} replace />;
  }

  // CUSTOMER, ADMIN, or unauthenticated → allow through
  return <>{children}</>;
}
