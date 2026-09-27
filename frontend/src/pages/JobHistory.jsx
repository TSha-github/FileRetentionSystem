// import { useState } from "react";
// import Navbar from "../components/Navbar";
// import Sidebar from "../components/Sidebar";
// import jobHistoryData from "../data/jobHistoryData";

// import "../styles/jobHistory.css";

// function JobHistory() {
//   const [history] = useState(jobHistoryData);
//   const [search, setSearch] = useState("");

//   const filteredHistory = history.filter(
//     (item) =>
//       item.customer_name.toLowerCase().includes(search.toLowerCase()) ||
//       item.project_name.toLowerCase().includes(search.toLowerCase()) ||
//       item.action.toLowerCase().includes(search.toLowerCase()) ||
//       item.reason.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <>
//       <Sidebar />

//       <div className="main-content">
//         <Navbar />

//         <div className="history-container">

//           <div className="history-header">
//             <h2>Job History</h2>
//           </div>

//           <div className="search-box">
//             <input
//               type="text"
//               placeholder="Search Job History..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>

//           <table className="history-table">
//             <thead>
//               <tr>
//                 <th>History ID</th>
//                 <th>Job ID</th>
//                 <th>Customer</th>
//                 <th>Project</th>
//                 <th>Action</th>
//                 <th>Reason</th>
//                 <th>Changed By</th>
//                 <th>Changed At</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filteredHistory.map((item) => (
//                 <tr key={item.history_id}>
//                   <td>{item.history_id}</td>
//                   <td>{item.job_id}</td>
//                   <td>{item.customer_name}</td>
//                   <td>{item.project_name}</td>

//                   <td>
//                     <span
//                       className={
//                         item.action === "Enabled"
//                           ? "history-enabled"
//                           : "history-disabled"
//                       }
//                     >
//                       {item.action}
//                     </span>
//                   </td>

//                   <td>{item.reason}</td>
//                   <td>{item.changed_by}</td>
//                   <td>{item.changed_at}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//         </div>
//       </div>
//     </>
//   );
// }

// export default JobHistory;
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import api from "../services/api";

import "../styles/jobHistory.css";

function JobHistory() {
  const [history, setHistory] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD JOB HISTORY
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const loadJobHistory = async () => {
      try {
        const response = await api.get("/job-history");


        const data = response.data.data || [];

        if (isMounted) {
          setHistory(data);
          setError("");
          setLoading(false);
        }
      } catch (err) {

        // Unauthorized
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          window.location.href = "/";
          return;
        }

        if (isMounted) {
          // Forbidden
          if (err.response?.status === 403) {
            setError(
              "You do not have permission to view job history."
            );
          } else {
            setError(
              err.response?.data?.message ||
                "Failed to load job history."
            );
          }

          setLoading(false);
        }
      }
    };

    loadJobHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================
  const filteredHistory = history.filter(
    (item) =>
      (item.customer_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      (item.project_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      (item.action || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      (item.reason || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return <div>Loading job history...</div>;
  }

  // ==========================================
  // ERROR
  // ==========================================
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="history-container">

          {/* Header */}
          <div className="history-header">
            <h2>Job History</h2>
          </div>

          {/* Search */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search Job History..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          {/* Job History Table */}
          <table className="history-table">

            <thead>
              <tr>
                <th>History ID</th>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Project</th>
                <th>Action</th>
                <th>Reason</th>
                <th>Changed By</th>
                <th>Changed At</th>
              </tr>
            </thead>

            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <tr key={item.history_id}>

                    <td>
                      {item.history_id || "-"}
                    </td>

                    <td>
                      {item.job_id || "-"}
                    </td>

                    <td>
                      {item.customer_name || "-"}
                    </td>

                    <td>
                      {item.project_name || "-"}
                    </td>

                    <td>
                    <span
  className={
    item.action === "Enabled" ||
    item.action === "Created" ||
    item.action === "Updated"
      ? "history-enabled"
      : "history-disabled"
  }
>
  {item.action || "-"}
</span>
                    </td>

                    <td>
                      {item.reason || "-"}
                    </td>

                    <td>
                      {item.changed_by || "-"}
                    </td>

                    <td>
                      {item.changed_at || "-"}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    No job history found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>

        </div>
      </div>
    </>
  );
}

export default JobHistory;