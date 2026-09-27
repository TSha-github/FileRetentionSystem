import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import "../styles/errorLogs.css";

const initialFilters = { severity: "", module: "", status_code: "", from: "", to: "" };

function ErrorLogs() {
  const [errors, setErrors] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [meta, setMeta] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadErrorLogs = async () => {
      setLoading(true);
      try {
        const response = await api.get("/error-logs", { params: { ...filters, page: meta.page, pageSize: meta.pageSize } });
        if (!isMounted) return;
        setErrors(response.data.data || []);
        setMeta((current) => ({ ...current, ...(response.data.meta || {}) }));
        setError("");
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error?.message || requestError.response?.data?.message || "Failed to load error logs.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadErrorLogs();
    return () => { isMounted = false; };
  }, [filters, meta.page, meta.pageSize]);

  const updateDraft = (event) => setDraftFilters((current) => ({ ...current, [event.target.name]: event.target.value }));

  const applyFilters = (event) => {
    event.preventDefault();
    setMeta((current) => ({ ...current, page: 1 }));
    setFilters({ ...draftFilters });
  };

  const clearFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setMeta((current) => ({ ...current, page: 1 }));
  };

  const goToPage = (page) => setMeta((current) => ({ ...current, page: Math.max(1, Math.min(page, current.totalPages || 1)) }));

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-container error-logs-page">
          <div className="page-heading">
            <div>
              <h2>Error Logs</h2>
              <p>Centralized application, database, filesystem, and authorization failures.</p>
            </div>
            <span className="result-count">{meta.total || 0} records</span>
          </div>

          <form className="error-filters" onSubmit={applyFilters}>
            <select name="severity" value={draftFilters.severity} onChange={updateDraft} aria-label="Severity">
              <option value="">All severities</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <input name="module" value={draftFilters.module} onChange={updateDraft} placeholder="Module" />
            <input name="status_code" value={draftFilters.status_code} onChange={updateDraft} placeholder="HTTP status" inputMode="numeric" />
            <input name="from" type="datetime-local" value={draftFilters.from} onChange={updateDraft} aria-label="From" />
            <input name="to" type="datetime-local" value={draftFilters.to} onChange={updateDraft} aria-label="To" />
            <button type="submit">Apply</button>
            <button type="button" className="secondary-button" onClick={clearFilters}>Clear</button>
          </form>

          {loading ? <div className="empty-state">Loading error logs...</div> : error ? <div className="error-state">{error}</div> : (
            <>
              <div className="table-scroll">
                <table className="table error-log-table">
                  <thead>
                    <tr><th>Time</th><th>Severity</th><th>Module</th><th>Type</th><th>Status</th><th>Endpoint</th><th>Message</th><th>Request ID</th></tr>
                  </thead>
                  <tbody>
                    {errors.length ? errors.map((item) => (
                      <tr key={item.error_id}>
                        <td>{item.error_time ? new Date(item.error_time).toLocaleString() : "-"}</td>
                        <td><span className={`severity severity-${String(item.severity || "ERROR").toLowerCase()}`}>{item.severity || "ERROR"}</span></td>
                        <td>{item.module || "-"}</td>
                        <td>{item.error_type || "-"}</td>
                        <td>{item.status_code || "-"}</td>
                        <td>{item.http_method && item.api_endpoint ? `${item.http_method} ${item.api_endpoint}` : item.file_path || "-"}</td>
                        <td className="message-cell">{item.error_message || "-"}</td>
                        <td>{item.request_id || "-"}</td>
                      </tr>
                    )) : <tr><td colSpan="8">No error logs found.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button type="button" disabled={meta.page <= 1} onClick={() => goToPage(meta.page - 1)}>Previous</button>
                <span>Page {meta.page} of {Math.max(meta.totalPages || 1, 1)}</span>
                <button type="button" disabled={meta.page >= (meta.totalPages || 1)} onClick={() => goToPage(meta.page + 1)}>Next</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ErrorLogs;
