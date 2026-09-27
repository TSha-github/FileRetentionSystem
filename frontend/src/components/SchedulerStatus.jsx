import { useEffect, useState } from "react";
import api from "../services/api";

function rowsFrom(response) {
  return response?.data?.data ?? response?.data ?? [];
}

function SchedulerStatus() {
  const [running, setRunning] = useState(false);
  const [latestRun, setLatestRun] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get("/scheduler/status"),
      api.get("/scheduler-logs?page=1&page_size=1"),
    ])
      .then(([statusResponse, logsResponse]) => {
        if (!mounted) return;
        const status = statusResponse?.data?.data ?? statusResponse?.data ?? {};
        const logs = rowsFrom(logsResponse);
        setRunning(Boolean(status.running));
        setLatestRun(logs[0] || null);
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.response?.data?.message || "Scheduler status unavailable.");
      });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="scheduler-card">
      <h2>Scheduler Status</h2>
      <div className="status">
        <span className={running ? "running" : "stopped"}></span>
        <h3>{running ? "Running" : "Idle"}</h3>
      </div>
      {error ? (
        <p>{error}</p>
      ) : (
        <div className="scheduler-info">
          <p><strong>Last Recorded Run:</strong> {latestRun?.start_time || "No run recorded"}</p>
          <p><strong>Last Status:</strong> {latestRun?.status || "-"}</p>
          <p><strong>Jobs Processed:</strong> {latestRun?.jobs_processed ?? "-"}</p>
          <p><strong>Files Deleted:</strong> {latestRun?.files_deleted ?? "-"}</p>
          <p><strong>Errors:</strong> {latestRun?.errors_count ?? "-"}</p>
          <p><strong>Next Run:</strong> Managed by the C# worker deployment</p>
        </div>
      )}
    </div>
  );
}

export default SchedulerStatus;
