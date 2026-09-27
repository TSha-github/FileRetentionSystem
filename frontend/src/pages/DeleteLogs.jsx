import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import api from "../services/api";

import "../styles/deleteLogs.css";

function DeleteLogs() {
  const [logs, setLogs] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD DELETE LOGS WHEN PAGE OPENS
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const loadDeleteLogs = async () => {
  try {
    const response = await api.get("/delete-logs");


    const data = response.data.data || [];

    if (isMounted) {
      setLogs(data);
      setError("");
      setLoading(false);
    }
  } catch (err) {

    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/";
      return;
    }

    if (isMounted) {
      if (err.response?.status === 403) {
        setError(
          "You do not have permission to view delete logs."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load delete logs."
        );
      }

      setLoading(false);
    }
  }
};

    loadDeleteLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================
  const filteredLogs = logs.filter(
    (log) =>
      (log.customer_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      (log.project_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      (log.file_name || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return <div>Loading delete logs...</div>;
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

        <div className="delete-container">

          {/* Header */}
          <div className="delete-header">
            <h2>Delete Logs</h2>
          </div>

          {/* Search */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          {/* Delete Logs Table */}
          <table className="delete-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Project</th>
                <th>File</th>
                <th>Type</th>
                <th>Deleted At</th>
                <th>Retention</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.delete_log_id}>

                    <td>
                      {log.delete_log_id || "-"}
                    </td>

                    <td>
                      {log.customer_name || "-"}
                    </td>

                    <td>
                      {log.project_name || "-"}
                    </td>

                    <td>
                      {log.file_name || "-"}
                    </td>

                    <td>
                      {log.file_type || "-"}
                    </td>

                    <td>
                      {log.deleted_at || "-"}
                    </td>

                    <td>
                      {log.retention_hours !== null &&
                      log.retention_hours !== undefined
                        ? `${log.retention_hours} hrs`
                        : "-"}
                    </td>

                    <td>
                      <span
                        className={
                          log.status === "Success"
                            ? "status-success"
                            : "status-failed"
                        }
                      >
                        {log.status || "-"}
                      </span>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    No delete logs found.
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

export default DeleteLogs;