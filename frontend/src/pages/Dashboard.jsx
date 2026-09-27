// import { useEffect, useState } from "react";

// import Navbar from "../components/Navbar";
// import Sidebar from "../components/Sidebar";
// import DashboardCard from "../components/DashboardCard";
// import DataTable from "../components/DataTable";
// import SchedulerStatus from "../components/SchedulerStatus";

// import { FaUsers, FaFolderOpen } from "react-icons/fa";
// import {
//   MdDelete,
//   MdError,
//   MdSchedule,
//   MdPeople,
// } from "react-icons/md";

// import api from "../services/api";

// import "../styles/dashboard.css";

// function Dashboard() {
//   const [dashboardData, setDashboardData] = useState({
//     customers: 0,
//     activeJobs: 0,
//     deletedFiles: 0,
//     errorLogs: 0,
//     schedulerRuns: 0,
//     users: 0,
//     recentDeleteLogs: [],
//     recentErrorLogs: [],
//   });

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

// useEffect(() => {
//   const fetchDashboard = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await api.get("/dashboard");


//       setDashboardData(response.data.data);

//     } catch (err) {

//       if (err.response?.status === 401) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         window.location.href = "/";
//         return;
//       }

//       if (err.response?.status === 403) {
//         setError("You do not have permission to view the dashboard.");
//       } else {
//         setError(
//           err.response?.data?.message ||
//           "Failed to load dashboard data."
//         );
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchDashboard();
// }, []);

//   const recentDeleteLogs = dashboardData.recentDeleteLogs.map((log) => ({
//     "File Name": log.file_name || "-",
//     "Customer": log.customer_name || "-",
//     "Status": log.status || "-",
//   }));

//   const recentErrorLogs = dashboardData.recentErrorLogs.map((log) => ({
//     "File Name": log.file_name || "-",
//     "Error": log.error_message || "-",
//   }));

//   return (
//     <>
//       <Sidebar />

//       <div className="main-content">
//         <Navbar />

//         <div className="dashboard-container">

//           {/* Page Heading */}
//           <div className="dashboard-header">
//             <h2>Dashboard</h2>
//             <p>File Retention System Overview</p>
//           </div>

//           {/* Loading */}
//           {loading && (
//             <p>Loading dashboard...</p>
//           )}

//           {/* Error */}
//           {error && (
//             <p className="error-message">
//               {error}
//             </p>
//           )}

//           {!loading && !error && (
//             <>
//               {/* Dashboard Cards */}
//               <div className="dashboard">

//                 <DashboardCard
//                   icon={<FaUsers />}
//                   title="Customers"
//                   value={dashboardData.customers}
//                 />

//                 <DashboardCard
//                   icon={<FaFolderOpen />}
//                   title="Active Jobs"
//                   value={dashboardData.activeJobs}
//                 />

//                 <DashboardCard
//                   icon={<MdDelete />}
//                   title="Deleted Files"
//                   value={dashboardData.deletedFiles}
//                 />

//                 <DashboardCard
//                   icon={<MdError />}
//                   title="Error Logs"
//                   value={dashboardData.errorLogs}
//                 />

//                 <DashboardCard
//                   icon={<MdSchedule />}
//                   title="Scheduler Runs"
//                   value={dashboardData.schedulerRuns}
//                 />

//                 <DashboardCard
//                   icon={<MdPeople />}
//                   title="Users"
//                   value={dashboardData.users}
//                 />

//               </div>

//               {/* Recent Delete Logs */}
//               <DataTable
//                 title="Recent Delete Logs"
//                 headers={[
//                   "File Name",
//                   "Customer",
//                   "Status",
//                 ]}
//                 data={recentDeleteLogs}
//               />

//               {/* Recent Error Logs */}
//               <DataTable
//                 title="Recent Error Logs"
//                 headers={[
//                   "File Name",
//                   "Error",
//                 ]}
//                 data={recentErrorLogs}
//               />

//               {/* Scheduler Status */}
//               <SchedulerStatus />

//             </>
//           )}

//         </div>
//       </div>
//     </>
//   );
// }

// export default Dashboard;
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";
import DataTable from "../components/DataTable";
import SchedulerStatus from "../components/SchedulerStatus";

import { FaUsers, FaFolderOpen } from "react-icons/fa";
import {
  MdDelete,
  MdError,
  MdSchedule,
  MdPeople,
} from "react-icons/md";

import api from "../services/api";

import "../styles/dashboard.css";

function Dashboard() {
    const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const isAdmin = user?.role === "Admin";
  const [dashboardData, setDashboardData] = useState({
    customers: 0,
    activeJobs: 0,
    deletedFiles: 0,
    errorLogs: 0,
    schedulerRuns: 0,
    users: 0,
    recentDeleteLogs: [],
    recentErrorLogs: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/dashboard");


        setDashboardData(response.data.data);
      } catch (err) {

        // Unauthorized - token expired or invalid
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          window.location.href = "/";
          return;
        }

        // Forbidden - user doesn't have permission
        if (err.response?.status === 403) {
          setError(
            "You do not have permission to view the dashboard."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Failed to load dashboard data."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Loading
  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  // Error
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Recent Delete Logs
  const recentDeleteLogs = dashboardData.recentDeleteLogs.map((log) => ({
    "File Name": log.file_name || "-",
    Customer: log.customer_name || "-",
    Status: log.status || "-",
    "Deleted At": log.deleted_at || "-",
  }));

  // Recent Error Logs
  const recentErrorLogs = dashboardData.recentErrorLogs.map((log) => ({
    Error: log.error_message || "-",
    "File Name": log.file_name || "-",
    "Created At": log.error_time || log.time || log.created_at || "-",
  }));

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Navbar />

        <div className="dashboard-content">

          {/* Page Heading */}
          <div className="dashboard-header">
            <h1>Dashboard</h1>
            <p>File Retention System Overview</p>
          </div>

          {/* Dashboard Cards */}
          <div className="dashboard-cards">

            <DashboardCard
              title="Customers"
              value={dashboardData.customers}
              icon={<FaUsers />}
            />

            <DashboardCard
              title="Active Jobs"
              value={dashboardData.activeJobs}
              icon={<FaFolderOpen />}
            />

            <DashboardCard
              title="Deleted Files"
              value={dashboardData.deletedFiles}
              icon={<MdDelete />}
            />

            <DashboardCard
              title="Error Logs"
              value={dashboardData.errorLogs}
              icon={<MdError />}
            />
{isAdmin && (
  <DashboardCard
    title="Scheduler Runs"
    value={dashboardData.schedulerRuns}
    icon={<MdSchedule />}
  />
)}

            <DashboardCard
              title="Users"
              value={dashboardData.users}
              icon={<MdPeople />}
            />

          </div>

          {/* Scheduler Status */}
   {/* Scheduler Status - Admin only */}
{isAdmin && <SchedulerStatus />}

          {/* Recent Delete Logs */}
          <DataTable
            title="Recent Delete Logs"
            headers={[
              "File Name",
              "Customer",
              "Status",
              "Deleted At",
            ]}
            data={recentDeleteLogs}
          />

          {/* Recent Error Logs */}
          <DataTable
            title="Recent Error Logs"
            headers={[
              "Error",
              "File Name",
              "Created At",
            ]}
            data={recentErrorLogs}
          />

        </div>
      </div>
    </div>
  );
}

export default Dashboard;