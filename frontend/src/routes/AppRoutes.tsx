import { Routes, Route, Link } from 'react-router-dom'
import HomePage from '../pages/Home/HomePage'
import DesignerPage from "../pages/Designer/DesignerPage";
import AdminGuard from './AdminGuard';
import RoleGuard from './RoleGuard';
import CustomerGuard from './CustomerGuard';
import AdminLayout from '../pages/Admin/AdminLayout';
import AdminOverview from '../pages/Admin/AdminOverview';
import AdminOrders from '../pages/Admin/AdminOrders';
import AdminPricing from '../pages/Admin/AdminPricing';
import AdminCardOptions from '../pages/Admin/AdminCardOptions';
import AdminTemplates from '../pages/Admin/AdminTemplates';
import AdminOrderDetail from '../pages/Admin/AdminOrderDetail';
import AdminUsers from '../pages/Admin/AdminUsers';
import DesignQueueLayout from '../pages/DesignQueue/DesignQueueLayout';
import DesignQueuePage from '../pages/DesignQueue/DesignQueuePage';
import DesignOrderDetail from '../pages/DesignQueue/DesignOrderDetail';
import PrintQueueLayout from '../pages/PrintQueue/PrintQueueLayout';
import PrintQueuePage from '../pages/PrintQueue/PrintQueuePage';
import PrintOrderDetail from '../pages/PrintQueue/PrintOrderDetail';
import ShippingQueueLayout from '../pages/ShippingQueue/ShippingQueueLayout';
import ShippingQueuePage from '../pages/ShippingQueue/ShippingQueuePage';
import ShippingOrderDetail from '../pages/ShippingQueue/ShippingOrderDetail';
import TemplatesPage from '../pages/Templates/TemplatesPage';
import OrdersPage from '../pages/Orders/OrdersPage';
import ResetPassword from '../pages/ResetPassword'
import LoginPage from '../pages/Login/LoginPage';

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
      <Route path="/designer/:id" element={<CustomerGuard><DesignerPage /></CustomerGuard>} />
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
        <Route path="orders/:orderId" element={<AdminOrderDetail />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="pricing" element={<AdminPricing />} />
        <Route path="card-options" element={<AdminCardOptions />} />
        <Route path="templates" element={<AdminTemplates />} />
      </Route>

      <Route
        path="/design-queue"
        element={
          <RoleGuard roles={["ADMIN", "DESIGN"]}>
            <DesignQueueLayout />
          </RoleGuard>
        }
      >
        <Route index element={<DesignQueuePage />} />
        <Route path=":orderId" element={<DesignOrderDetail />} />
      </Route>

      <Route
        path="/print-queue"
        element={
          <RoleGuard roles={["ADMIN", "PRINTING"]}>
            <PrintQueueLayout />
          </RoleGuard>
        }
      >
        <Route index element={<PrintQueuePage />} />
        <Route path=":orderId" element={<PrintOrderDetail />} />
      </Route>

      <Route
        path="/shipping-queue"
        element={
          <RoleGuard roles={["ADMIN", "SHIPPING"]}>
            <ShippingQueueLayout />
          </RoleGuard>
        }
      >
        <Route index element={<ShippingQueuePage />} />
        <Route path=":orderId" element={<ShippingOrderDetail />} />
      </Route>

      <Route path="/templates" element={<TemplatesPage />} />
      <Route path="/orders" element={<CustomerGuard><OrdersPage /></CustomerGuard>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
