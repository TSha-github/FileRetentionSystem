// import { useEffect, useState } from "react";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import api from "../services/api";

import "../styles/schedulerLogs.css";

function SchedulerLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD SCHEDULER LOGS
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const loadSchedulerLogs = async () => {
      try {
        const response = await api.get("/scheduler-logs");

        

        const data = response.data.data || [];

        if (isMounted) {
          setLogs(data);
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
          if (err.response?.status === 403) {
            setError(
              "You do not have permission to view scheduler logs."
            );
          } else {
            setError(
              err.response?.data?.message ||
                "Failed to load scheduler logs."
            );
          }

          setLoading(false);
        }
      }
    };

    loadSchedulerLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================
  const filteredLogs = logs.filter((log) => {
    const status = String(log.status || "").toLowerCase();
    const searchText = search.toLowerCase();

    return status.includes(searchText);
  });

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return <div>Loading scheduler logs...</div>;
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

        <div className="scheduler-container">

          <div className="scheduler-header">
            <h2>Scheduler Logs</h2>
          </div>

          {/* Search */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search Scheduler Logs..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          {/* Scheduler Logs Table */}
          <table className="scheduler-table">

            <thead>
              <tr>
                <th>Log ID</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Jobs Processed</th>
                <th>Files Deleted</th>
                <th>Errors</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.scheduler_log_id}
                  >

                    <td>
                      {log.scheduler_log_id}
                    </td>

                    <td>
                      {log.start_time || "-"}
                    </td>

                    <td>
                      {log.end_time || "-"}
                    </td>

                    <td>
                      {log.jobs_processed ?? 0}
                    </td>

                    <td>
                      {log.files_deleted ?? 0}
                    </td>

                    <td>
                      {log.errors_count ?? 0}
                    </td>

                    <td>
                      <span
                        className={
                          log.status === "Completed"
                            ? "scheduler-success"
                            : "scheduler-warning"
                        }
                      >
                        {log.status || "-"}
                      </span>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    No scheduler logs found.
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

export default SchedulerLogs;