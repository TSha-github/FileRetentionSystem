import { Link, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdDelete,
  MdError,
  MdSchedule,
  MdLogout,
  MdPeople,
  MdFolder,
  MdSecurity,
  MdPerson
} from "react-icons/md";
import { FaChartBar } from "react-icons/fa";
import "../styles/Sidebar.css";

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    return null;
  }
}

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const isAdmin =
    user?.role === "Admin";

  const isCustomerUser =
    user?.role === "Customer User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/", {
      replace: true
    });
  };

  return (
    <div className="sidebar">

      <div className="logo">
        <h2>FRS</h2>
        <p>File Retention System</p>
      </div>

      <ul className="menu">

        {/* ============================= */}
        {/* ALL LOGGED-IN USERS */}
        {/* ============================= */}

        <li>
          <Link to="/dashboard">
            <MdDashboard className="icon" />
            Dashboard
          </Link>
        </li>


        {/* ============================= */}
        {/* ADMIN ONLY */}
        {/* ============================= */}

        {isAdmin && (
          <>
            <li>
              <Link to="/customer-master">
                <MdPeople className="icon" />
                Customer Master
              </Link>
            </li>

            <li>
              <Link to="/job-master">
                <MdFolder className="icon" />
                Job Master
              </Link>
            </li>

            <li>
              <Link to="/users-management">
                <MdPerson className="icon" />
                User Management
              </Link>
            </li>

            <li>
              <Link to="/role-management">
                <MdSecurity className="icon" />
                Role Management
              </Link>
            </li>

            <li>
              <Link to="/error-logs">
                <MdError className="icon" />
                Error Logs
              </Link>
            </li>

            {/* Scheduler Logs are system-wide,
                therefore Admin only */}
            <li>
              <Link to="/scheduler-logs">
                <MdSchedule className="icon" />
                Scheduler Logs
              </Link>
            </li>
          </>
        )}


        {/* ============================= */}
        {/* ADMIN + CUSTOMER USER */}
        {/* ============================= */}

        {(isAdmin || isCustomerUser) && (
          <>
            <li>
              <Link to="/account">
                <MdPerson className="icon" />
                Change Password
              </Link>
            </li>

            <li>
              <Link to="/delete-logs">
                <MdDelete className="icon" />
                Delete Logs
              </Link>
            </li>

            <li>
              <Link to="/job-history">
                <FaChartBar className="icon" />
                Job History
              </Link>
            </li>

            <li>
              <Link to="/reports">
                <FaChartBar className="icon" />
                Reports
              </Link>
            </li>
          </>
        )}

      </ul>

      <div className="logout">
        <button
          type="button"
          onClick={handleLogout}
        >
          <MdLogout className="icon" />
          Logout
        </button>
      </div>

    </div>
  );
}