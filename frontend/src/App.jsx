import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CustomerMaster from "./pages/CustomerMaster";
import JobMaster from "./pages/JobMaster";
import UserManagement from "./pages/UserManagement";
import RoleManagement from "./pages/RoleManagement";
import Reports from "./pages/Reports";
import DeleteLogs from "./pages/DeleteLogs";
import ErrorLogs from "./pages/ErrorLogs";
import SchedulerLogs from "./pages/SchedulerLogs";
import JobHistory from "./pages/JobHistory";
import Account from "./pages/Account";
import ProtectedRoute from "./components/ProtectedRoute";

const ADMIN = ["Admin"];
const CUSTOMER_READ = ["Admin", "Customer User"];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<ProtectedRoute allowedRoles={CUSTOMER_READ} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/delete-logs" element={<DeleteLogs />} />
        <Route path="/scheduler-logs" element={<SchedulerLogs />} />
        <Route path="/job-history" element={<JobHistory />} />
        <Route path="/account" element={<Account />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={ADMIN} />}>
        <Route path="/customer-master" element={<CustomerMaster />} />
        <Route path="/job-master" element={<JobMaster />} />
        <Route path="/users-management" element={<UserManagement />} />
        <Route path="/role-management" element={<RoleManagement />} />
        <Route path="/error-logs" element={<ErrorLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
