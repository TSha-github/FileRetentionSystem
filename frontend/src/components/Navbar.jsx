// import "../styles/Navbar.css";

// function Navbar() {
//   return (
//     <div className="navbar">

//       <div className="page-title">
//         Dashboard
//       </div>

//       <div className="user-section">

//         <div className="user-info">
//           <h4>Admin</h4>
//           <p>admin@gmail.com</p>
//         </div>

//         <div className="profile">
//           A
//         </div>

//       </div>

//     </div>
//   );
// }

// export default Navbar;
import { useLocation } from "react-router-dom";
import "../styles/Navbar.css";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/customer-master": "Customer Master",
  "/job-master": "Job Master",
  "/users-management": "User Management",
  "/role-management": "Role Management",
  "/reports": "Reports",
  "/delete-logs": "Delete Logs",
  "/error-logs": "Error Logs",
  "/scheduler-logs": "Scheduler Logs",
  "/job-history": "Job History",
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function Navbar() {
  const location = useLocation();
  const user = getStoredUser();

  const username = user?.username || "User";
  const role = user?.role || "";
  const pageTitle = pageTitles[location.pathname] || "File Retention System";
  const initial = username.charAt(0).toUpperCase() || "U";

  return (
    <div className="navbar">
      <div className="page-title">{pageTitle}</div>

      <div className="user-section">
        <div className="user-info">
          <h4>{username}</h4>
          <p>{role}</p>
        </div>
        <div className="profile">{initial}</div>
      </div>
    </div>
  );
}

export default Navbar;
