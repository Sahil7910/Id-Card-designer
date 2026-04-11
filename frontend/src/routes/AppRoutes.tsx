import { Routes, Route, Link } from 'react-router-dom'
import HomePage from '../pages/Home/HomePage'
import DesignerPage from "../pages/Designer/DesignerPage";
import AdminGuard from './AdminGuard';
import AdminLayout from '../pages/Admin/AdminLayout';
import AdminOverview from '../pages/Admin/AdminOverview';
import AdminOrders from '../pages/Admin/AdminOrders';
import AdminPricing from '../pages/Admin/AdminPricing';
import AdminCardOptions from '../pages/Admin/AdminCardOptions';
import AdminTemplates from '../pages/Admin/AdminTemplates';
import TemplatesPage from '../pages/Templates/TemplatesPage';

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0b0f1a", color: "#e2e8f0" }}>
      <h1 style={{ fontSize: 72, fontWeight: 800, color: "#e05c1a", margin: 0 }}>404</h1>
      <p style={{ fontSize: 18, color: "#64748b", marginTop: 12 }}>Page not found</p>
      <Link to="/" style={{ marginTop: 24, padding: "10px 24px", background: "#e05c1a", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
        Go Home
      </Link>
    </div>
  );
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/designer/:id" element={<DesignerPage />} />
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="pricing" element={<AdminPricing />} />
        <Route path="card-options" element={<AdminCardOptions />} />
        <Route path="templates" element={<AdminTemplates />} />
      </Route>
      <Route path="/templates" element={<TemplatesPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
