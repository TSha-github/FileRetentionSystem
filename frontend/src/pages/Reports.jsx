// import { useState } from "react";
// import Navbar from "../components/Navbar";
// import Sidebar from "../components/Sidebar";
// import reportsData from "../data/reportsData";

// import "../styles/report.css";

// function Reports() {
//   const [reports] = useState(reportsData);
//   const [search, setSearch] = useState("");

//   const filteredReports = reports.filter(
//     (report) =>
//       report.customer_name.toLowerCase().includes(search.toLowerCase()) ||
//       report.project_name.toLowerCase().includes(search.toLowerCase()) ||
//       report.file_type.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <>
//       <Sidebar />

//       <div className="main-content">
//         <Navbar />

//         <div className="reports-container">

//           <div className="reports-header">
//             <h2>Reports</h2>
//           </div>

//           <div className="report-cards">

//             <div className="report-card">
//               <h3>Total Jobs</h3>
//               <p>5</p>
//             </div>

//             <div className="report-card">
//               <h3>Files Deleted</h3>
//               <p>50</p>
//             </div>

//             <div className="report-card">
//               <h3>Errors</h3>
//               <p>3</p>
//             </div>

//             <div className="report-card">
//               <h3>Active Jobs</h3>
//               <p>3</p>
//             </div>

//           </div>

//           <div className="search-box">
//             <input
//               type="text"
//               placeholder="Search Reports..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>

//           <table className="reports-table">

//             <thead>
//               <tr>
//                 <th>Report ID</th>
//                 <th>Customer</th>
//                 <th>Project</th>
//                 <th>File Type</th>
//                 <th>Files Processed</th>
//                 <th>Files Deleted</th>
//                 <th>Errors</th>
//                 <th>Status</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filteredReports.map((report) => (
//                 <tr key={report.report_id}>
//                   <td>{report.report_id}</td>
//                   <td>{report.customer_name}</td>
//                   <td>{report.project_name}</td>
//                   <td>{report.file_type}</td>
//                   <td>{report.files_processed}</td>
//                   <td>{report.files_deleted}</td>
//                   <td>{report.errors}</td>

//                   <td>
//                     <span
//                       className={
//                         report.status === "Completed"
//                           ? "report-success"
//                           : "report-warning"
//                       }
//                     >
//                       {report.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>

//           </table>

//         </div>
//       </div>
//     </>
//   );
// }

// export default Reports;
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

import "../styles/report.css";

const initialSummary = {
  totalJobs: 0,
  filesDeleted: 0,
  errors: 0,
  activeJobs: 0,
  customers: 0,
  schedulerRuns: 0,
};

function Reports() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(initialSummary);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // GET LOGGED-IN USER
  // ============================================================

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const role = user.role || user.role_name;

  const isAdmin = role === "Admin";

  // Customer User's customer
  const customerName =
    user.customer_name ||
    user.customerName ||
    "Your Customer";

  // ============================================================
  // LOAD REPORTS

  useEffect(() => {
    let mounted = true;

    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page: 1,
          pageSize: 100,
        };

        /*
         * IMPORTANT:
         *
         * Admin may select a customer.
         *
         * Customer User does NOT send customer_id.
         * Backend gets customer_id from JWT.
         */

        if (isAdmin && selectedCustomer) {
          params.customer_id = selectedCustomer;
        }

        const response = await api.get("/reports", {
          params,
        });

        const result = response.data?.data || {};

        if (mounted) {
          setSummary({
            ...initialSummary,
            ...(result.summary || {}),
          });

          setReports(
            Array.isArray(result.rows)
              ? result.rows
              : []
          );
        }
      } catch (err) {
        

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/";
          return;
        }

        if (mounted) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error?.message ||
              "Failed to load reports."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      mounted = false;
    };
  }, [isAdmin, selectedCustomer]);

  // ============================================================
  // LOAD CUSTOMERS FOR ADMIN
  // ============================================================

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const loadCustomers = async () => {
      try {
        const response = await api.get("/customers");

        const data =
          response.data?.data ||
          response.data ||
          [];

        setCustomers(
          Array.isArray(data) ? data : []
        );
            } catch {
        setCustomers([]);
      }

    };

    loadCustomers();
  }, [isAdmin]);

  // ============================================================
  // DOWNLOAD REPORT
  // ============================================================

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      setError("");

      const params = {};

      /*
       * ADMIN:
       * Send selected customer_id if selected.
       *
       * CUSTOMER USER:
       * DO NOT send customer_id.
       *
       * Backend gets customer_id from authenticated JWT.
       */

      if (isAdmin && selectedCustomer) {
        params.customer_id = selectedCustomer;
      }

      const response = await api.get(
        "/reports/download",
        {
          params,
          responseType: "blob",
        }
      );

      // ========================================================
      // CREATE FILE DOWNLOAD
      // ========================================================

      const blob = new Blob(
        [response.data],
        {
          type:
            response.headers?.["content-type"] ||
            "application/octet-stream",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      // ========================================================
      // GET FILENAME FROM BACKEND
      // ========================================================

      let filename =
        "retention-report.csv";

      const disposition =
        response.headers?.[
          "content-disposition"
        ];

      if (disposition) {
        const match =
          disposition.match(
            /filename="?([^"]+)"?/
          );

        if (match && match[1]) {
          filename = match[1];
        }
      }

      link.setAttribute(
        "download",
        filename
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (err) {

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        return;
      }

      if (err.response?.status === 403) {
        setError(
          "You are not authorized to download this report."
        );
        return;
      }

      setError(
        "Failed to download report."
      );
    } finally {
      setDownloading(false);
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredReports = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return reports;
    }

    return reports.filter((report) =>
      [
        report.report_id,
        report.customer_name,
        report.project_name,
        report.file_type,
        report.status,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [reports, search]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div>
        Loading reports...
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error && reports.length === 0) {
    return (
      <>
        <Sidebar />

        <div className="main-content">
          <Navbar />

          <div className="reports-container">
            <p className="error-message">
              {error}
            </p>
          </div>
        </div>
      </>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="reports-container">

          {/* ==================================================
              HEADER
              ================================================== */}

          <div className="reports-header">
  <h2>Reports</h2>

  <button
    type="button"
    className="download-report-btn"
    onClick={handleDownloadReport}
  >
    Download Report
  </button>
</div>


          {/* ==================================================
              CUSTOMER SELECTION
              ================================================== */}

          <div className="report-filter-section">

            {isAdmin ? (
              <>
                <label>
                  Customer
                </label>

                <select
                  value={selectedCustomer}
                  onChange={(e) =>
                    setSelectedCustomer(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    All Customers
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={
                          customer.customer_id
                        }
                        value={
                          customer.customer_id
                        }
                      >
                        {
                          customer.customer_name
                        }
                      </option>
                    )
                  )}
                </select>
              </>
            ) : (
              <>
                <label>
                  Customer
                </label>

                <input
                  type="text"
                  value={customerName}
                  readOnly
                  className="readonly-customer"
                />
              </>
            )}

          </div>


          {/* ==================================================
              DOWNLOAD BUTTON
              ================================================== */}

          <div className="report-download-section">

            <button
              className="download-report-btn"
              onClick={
                handleDownloadReport
              }
              disabled={downloading}
            >
              {downloading
                ? "Downloading..."
                : "Download Report"}
            </button>

          </div>


          {/* ==================================================
              ERROR
              ================================================== */}

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}


          {/* ==================================================
              SUMMARY CARDS
              ================================================== */}

          <div className="report-cards">

            <div className="report-card">
              <h3>Total Jobs</h3>
              <p>
                {summary.totalJobs}
              </p>
            </div>

            <div className="report-card">
              <h3>Files Deleted</h3>
              <p>
                {summary.filesDeleted}
              </p>
            </div>

            <div className="report-card">
              <h3>Errors</h3>
              <p>
                {summary.errors}
              </p>
            </div>

            <div className="report-card">
              <h3>Active Jobs</h3>
              <p>
                {summary.activeJobs}
              </p>
            </div>

          </div>


          {/* ==================================================
              SEARCH
              ================================================== */}

          <div className="search-box">

            <input
              type="text"
              placeholder="Search Reports..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          {/* ==================================================
              REPORT TABLE
              ================================================== */}

          <table className="reports-table">

            <thead>

              <tr>
                <th>Report ID</th>
                <th>Customer</th>
                <th>Project</th>
                <th>File Type</th>
                <th>Files Processed</th>
                <th>Files Deleted</th>
                <th>Errors</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {filteredReports.length > 0 ? (

                filteredReports.map(
                  (report) => (

                    <tr
                      key={
                        report.report_id
                      }
                    >

                      <td>
                        {
                          report.report_id
                        }
                      </td>

                      <td>
                        {
                          report.customer_name ||
                          "-"
                        }
                      </td>

                      <td>
                        {
                          report.project_name ||
                          "-"
                        }
                      </td>

                      <td>
                        {
                          report.file_type ||
                          "-"
                        }
                      </td>

                      <td>
                        {
                          report.files_processed ??
                          0
                        }
                      </td>

                      <td>
                        {
                          report.files_deleted ??
                          0
                        }
                      </td>

                      <td>
                        {
                          report.errors ??
                          0
                        }
                      </td>

                      <td>

                        <span
                          className={
                            report.status ===
                            "Completed"
                              ? "report-success"
                              : "report-warning"
                          }
                        >
                          {
                            report.status ||
                            "-"
                          }
                        </span>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="8"
                  >
                    No reports found.
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

export default Reports;