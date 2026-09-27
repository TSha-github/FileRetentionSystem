// // import { useState } from "react";
// // import Navbar from "../components/Navbar";
// // import Sidebar from "../components/Sidebar";
// // import jobData from "../data/jobData";
// // import customerData from "../data/customerData";

// // import "../styles/jobMaster.css";

// // function JobMaster() {
// //   const [jobs, setJobs] = useState(jobData);
// //   const [showForm, setShowForm] = useState(false);
// //   const [search, setSearch] = useState("");
// // const [newJob, setNewJob] = useState({
// //   customer_name: "",
// //   project_name: "",
// //   folder_path: "",
// //   file_type: "All Files",
// //   retention_hours: "",
// //   is_enabled: true,
// //   disable_reason: "",
// //   exclude_folder: false,
// // });

// // const [editingId, setEditingId] = useState(null);

// // const customers = customerData;
// //   const filteredJobs = jobs.filter(
// //     (job) =>
// //       job.customer_name.toLowerCase().includes(search.toLowerCase()) ||
// //       job.project_name.toLowerCase().includes(search.toLowerCase()) ||
// //       job.file_type.toLowerCase().includes(search.toLowerCase())
// //   );
// //   function addJob() {
// //   if (
// //     newJob.customer_name.trim() === "" ||
// //     newJob.project_name.trim() === "" ||
// //     newJob.folder_path.trim() === "" ||
// //     newJob.retention_hours === ""
// //   ) {
// //     alert("Please fill all fields.");
// //     return;
// //   }

// //   if (editingId !== null) {
// //     const updatedJobs = jobs.map((job) =>
// //       job.job_id === editingId
// //         ? {
// //             ...job,
// //             ...newJob,
// //           }
// //         : job
// //     );

// //     setJobs(updatedJobs);
// //     setEditingId(null);
// //   } else {
// //     const job = {
// //      job_id: Math.max(...jobs.map(job => job.job_id), 0) + 1,
// //       ...newJob,
// //     };

// //     setJobs([...jobs, job]);
// //   }



// //   setShowForm(false);
// // }
// // function deleteJob(id) {
// //   const updatedJobs = jobs.filter(
// //     (job) => job.job_id !== id
// //   );

// //   setJobs(updatedJobs);
// // }
// // function editJob(job) {
// //   setEditingId(job.job_id);

// //   setNewJob({
// //     customer_name: job.customer_name,
// //     project_name: job.project_name,
// //     folder_path: job.folder_path,
// //     file_type: job.file_type,
// //     retention_hours: job.retention_hours,
// //     is_enabled: job.is_enabled,
// //     disable_reason: job.disable_reason,
// //     exclude_folder: job.exclude_folder,
// //   });

// //   setShowForm(true);
// // }

// //   return (
// //     <>
// //       <Sidebar />

// //       <div className="main-content">
// //         <Navbar />

// //         <div className="job-container">

// //           {/* Header */}
// //           <div className="job-header">
// //             <h2>Job Master</h2>

// //            <button
// //   className="add-btn"
// //   onClick={() => {
// //     setEditingId(null);

// //     setNewJob({
// //       customer_name: "",
// //       project_name: "",
// //       folder_path: "",
// //       file_type: "All Files",
// //       retention_hours: "",
// //       is_enabled: true,
// //       disable_reason: "",
// //       exclude_folder: false,
// //     });

// //     setShowForm(true);
// //   }}
// // >
// //   + Add Job
// // </button>
// //           </div>

// //           {/* Search */}
// //           <div className="search-box">
// //             <input
// //               type="text"
// //               placeholder="Search Job..."
// //               value={search}
// //               onChange={(e) => setSearch(e.target.value)}
// //             />
// //           </div>

// //           {/* Job Table */}
// //           <table className="job-table">

// //             <thead>
// //               <tr>
// //                 <th>Job ID</th>
// //                 <th>Customer</th>
// //                 <th>Project</th>
// //                 <th>Folder Path</th>
// //                 <th>File Type</th>
// //                 <th>Retention</th>
// //                 <th>Status</th>
// //                 <th>Actions</th>
// //               </tr>
// //             </thead>

// //             <tbody>
// //               {filteredJobs.map((job) => (
// //                 <tr key={job.job_id}>

// //                   <td>{job.job_id}</td>

// //                   <td>{job.customer_name}</td>

// //                   <td>{job.project_name}</td>

// //                   <td>{job.folder_path}</td>

// //                   <td>{job.file_type}</td>

// //                   <td>{job.retention_hours} hrs</td>

// //                   <td>
// //                     <span
// //                       className={
// //                         job.is_enabled
// //                           ? "status-active"
// //                           : "status-inactive"
// //                       }
// //                     >
// //                       {job.is_enabled ? "Active" : "Inactive"}
// //                     </span>
// //                   </td>

// //                  <td>
// //   <button
// //     className="edit-btn"
// //     onClick={() => editJob(job)}
// //   >
// //     Edit
// //   </button>

// //   <button
// //     className="delete-btn"
// //     onClick={() => deleteJob(job.job_id)}
// //   >
// //     Delete
// //   </button>
// // </td>

// //                 </tr>
// //               ))}
// //             </tbody>

// //           </table>

// //           {/* Popup (Coming Next) */}
// //           {showForm && (
// //             <div className="popup">
// //               <div className="popup-content">

// //                 <h2>{editingId ? "Edit Job" : "Add Job"}</h2>
                
// // <select
// //   value={newJob.customer_name}
// //   onChange={(e) =>
// //     setNewJob({
// //       ...newJob,
// //       customer_name: e.target.value,
// //       folder_path: `D:/Retention/${e.target.value}`,
// //     })
// //   }
// // >
// //   <option value="">Select Customer</option>

// // {customers.map((customer) => (
// //   <option
// //     key={customer.id}
// //     value={customer.name}
// //   >
// //     {customer.name}
// //   </option>
// // ))}
// // </select>


// // <input
// //   type="text"
// //   placeholder="Project Name"
// //   value={newJob.project_name}
// //   onChange={(e) =>
// //     setNewJob({
// //       ...newJob,
// //       project_name: e.target.value,
// //     })
// //   }
// // />


// // <input
// //   type="text"
// //   value={newJob.folder_path}
// //   readOnly
// // />

// // <select
// //   value={newJob.file_type}
// //   onChange={(e) =>
// //     setNewJob({
// //       ...newJob,
// //       file_type: e.target.value,
// //     })
// //   }
// // >
// //   <option>All Files</option>
// //   <option>XML</option>
// //   <option>PDF</option>
// // </select>
// // <input
// //   type="number"
// //   placeholder="Retention Hours"
// //   value={newJob.retention_hours}
// //   onChange={(e) =>
// //     setNewJob({
// //       ...newJob,
// //       retention_hours: e.target.value,
// //     })
// //   }
// // />

// // <select
// //   value={newJob.is_enabled ? "Active" : "Inactive"}
// //   onChange={(e) =>
// //     setNewJob({
// //       ...newJob,
// //       is_enabled: e.target.value === "Active",
// //     })
// //   }
// // >
// //   <option>Active</option>
// //   <option>Inactive</option>
// // </select>

// // <input
// //   type="text"
// //   placeholder="Disable Reason"
// //   value={newJob.disable_reason}
// //   onChange={(e) =>
// //     setNewJob({
// //       ...newJob,
// //       disable_reason: e.target.value,
// //     })
// //   }
// // />

// // <label>
// //   <input
// //     type="checkbox"
// //     checked={newJob.exclude_folder}
// //     onChange={(e) =>
// //       setNewJob({
// //         ...newJob,
// //         exclude_folder: e.target.checked,
// //       })
// //     }
// //   />
// //   Exclude Folder
// // </label>

// // <div className="popup-buttons">

// //   <button onClick={addJob}>
// //     {editingId ? "Update" : "Save"}
// //   </button>

// //   <button
// //   onClick={() => {
// //     setShowForm(false);
// //     setEditingId(null);

// //     setNewJob({
// //       customer_name: "",
// //       project_name: "",
// //       folder_path: "",
// //       file_type: "All Files",
// //       retention_hours: "",
// //       is_enabled: true,
// //       disable_reason: "",
// //       exclude_folder: false,
// //     });
// //   }}
// // >
// //   Cancel
// // </button>

// // </div>
// //                 </div>

// //               </div>
            
// //           )}

// //         </div>
// //       </div>
// //     </>
// //   );
// // }

// // export default JobMaster;









// import { useEffect, useMemo, useState } from "react";

// import Navbar from "../components/Navbar";
// import Sidebar from "../components/Sidebar";

// import api from "../services/api";

// import "../styles/jobMaster.css";

// const FILE_TYPES = [
//   "XML",
//   "PDF",
//   "XLSX",
//   "CSV",
//   "TXT",
//   "DOCX",
// ];

// const emptyJob = {
//   customer_id: "",
//   customer_name: "",
//   project_name: "",
//   folder_path: "",
//   file_type: "XML",
//   retention_hours: "",
//   is_enabled: true,
//   disable_reason: "",
//   exclude_folder: false,
// };

// function getRows(response) {
//   return Array.isArray(response?.data?.data)
//     ? response.data.data
//     : [];
// }

// function JobMaster() {
//   const [jobs, setJobs] = useState([]);
//   const [customers, setCustomers] = useState([]);

//   const [showForm, setShowForm] = useState(false);
//   const [search, setSearch] = useState("");

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [editingId, setEditingId] = useState(null);

//   const [newJob, setNewJob] = useState({
//     ...emptyJob,
//   });

//   // ==========================================
//   // LOAD INITIAL DATA
//   // ==========================================
//   useEffect(() => {
//     let active = true;

//     const loadData = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const [
//           jobsResponse,
//           customersResponse,
//         ] = await Promise.all([
//           api.get("/jobs"),
//           api.get("/customers"),
//         ]);

//         if (!active) return;

//         setJobs(getRows(jobsResponse));
//         setCustomers(getRows(customersResponse));
//       } catch (requestError) {
//         if (!active) return;

//         if (requestError.response?.status === 401) {
//           localStorage.removeItem("token");
//           localStorage.removeItem("user");

//           window.location.href = "/";
//           return;
//         }

//         if (requestError.response?.status === 403) {
//           setError(
//             "You do not have permission to view Job Master."
//           );
//         } else {
//           setError(
//             requestError.response?.data?.message ||
//               "Unable to load Job Master."
//           );
//         }
//       } finally {
//         if (active) {
//           setLoading(false);
//         }
//       }
//     };

//     loadData();

//     return () => {
//       active = false;
//     };
//   }, []);

//   // ==========================================
//   // REFRESH JOBS
//   // ==========================================
//   const refreshJobs = async () => {
//     const response = await api.get("/jobs");

//     setJobs(getRows(response));
//   };

//   // ==========================================
//   // FILTER / SEARCH
//   // ==========================================
//   const filteredJobs = useMemo(() => {
//     const value = search.toLowerCase().trim();

//     if (!value) {
//       return jobs;
//     }

//     return jobs.filter((job) =>
//       [
//         job.job_id,
//         job.customer_name,
//         job.project_name,
//         job.folder_path,
//         job.file_type,
//         job.disable_reason,
//       ]
//         .filter(
//           (item) =>
//             item !== null &&
//             item !== undefined
//         )
//         .join(" ")
//         .toLowerCase()
//         .includes(value)
//     );
//   }, [jobs, search]);

//   // ==========================================
//   // RESET FORM
//   // ==========================================
//   const resetForm = () => {
//     setEditingId(null);
//     setNewJob({
//       ...emptyJob,
//     });
//     setShowForm(false);
//   };

//   // ==========================================
//   // OPEN ADD FORM
//   // ==========================================
//   const openAddForm = () => {
//     setError("");
//     setSuccess("");
//     setEditingId(null);

//     setNewJob({
//       ...emptyJob,
//     });

//     setShowForm(true);
//   };

//   // ==========================================
//   // OPEN EDIT FORM
//   // ==========================================
//   const editJob = (job) => {
//     setError("");
//     setSuccess("");

//     setEditingId(job.job_id);

//     setNewJob({
//       customer_id:
//         job.customer_id !== null &&
//         job.customer_id !== undefined
//           ? String(job.customer_id)
//           : "",

//       customer_name:
//         job.customer_name || "",

//       project_name:
//         job.project_name || "",

//       folder_path:
//         job.folder_path || "",

//       file_type:
//         FILE_TYPES.includes(
//           String(job.file_type || "").toUpperCase()
//         )
//           ? String(job.file_type).toUpperCase()
//           : "XML",

//       retention_hours:
//         job.retention_hours !== null &&
//         job.retention_hours !== undefined
//           ? String(job.retention_hours)
//           : "",

//       is_enabled:
//         Boolean(job.is_enabled),

//       disable_reason:
//         job.disable_reason || "",

//       exclude_folder:
//         Boolean(job.exclude_folder),
//     });

//     setShowForm(true);
//   };

//   // ==========================================
//   // SAVE / UPDATE JOB
//   // ==========================================
//   const saveJob = async (event) => {
//     event.preventDefault();

//     setError("");
//     setSuccess("");

//     if (!newJob.customer_id) {
//       setError("Please select a customer.");
//       return;
//     }

//     if (!newJob.project_name.trim()) {
//       setError("Project name is required.");
//       return;
//     }

//     if (!newJob.folder_path.trim()) {
//       setError("Folder path is required.");
//       return;
//     }

//     if (!newJob.file_type) {
//       setError("Please select a file type.");
//       return;
//     }

//     const retentionHours = Number(
//       newJob.retention_hours
//     );

//     if (
//       !Number.isFinite(retentionHours) ||
//       retentionHours <= 0
//     ) {
//       setError(
//         "Retention hours must be greater than 0."
//       );
//       return;
//     }

//     const customerId = Number(
//       newJob.customer_id
//     );

//     if (
//       !Number.isSafeInteger(customerId) ||
//       customerId <= 0
//     ) {
//       setError("Invalid customer selection.");
//       return;
//     }

//     const payload = {
//       customer_id: customerId,

//       project_name:
//         newJob.project_name.trim(),

//       folder_path:
//         newJob.folder_path.trim(),

//       file_type:
//         newJob.file_type.toUpperCase(),

//       retention_hours:
//         retentionHours,

//       is_enabled:
//         Boolean(newJob.is_enabled),

//       disable_reason:
//         newJob.is_enabled
//           ? null
//           : newJob.disable_reason.trim() ||
//             "Disabled by administrator",

//       exclude_folder:
//         Boolean(newJob.exclude_folder),
//     };

//     try {
//       setSaving(true);

//       if (editingId !== null) {
//         await api.patch(
//           `/jobs/${editingId}`,
//           payload
//         );

//         setSuccess(
//           "Job updated successfully."
//         );
//       } else {
//         await api.post(
//           "/jobs",
//           payload
//         );

//         setSuccess(
//           "Job created successfully."
//         );
//       }

//       await refreshJobs();

//       resetForm();
//     } catch (requestError) {
//       setError(
//         requestError.response?.data?.message ||
//           (editingId !== null
//             ? "Unable to update the job."
//             : "Unable to create the job.")
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ==========================================
//   // RETIRE JOB
//   // ==========================================
//   const retireJob = async (job) => {
//     if (!job.is_enabled) {
//       setError(
//         "This job is already inactive or retired."
//       );
//       return;
//     }

//     const confirmed =
//       window.confirm(
//         `Retire "${job.project_name}"?\n\n` +
//           "The job will remain in the database for audit history, " +
//           "but the retention worker will no longer process it."
//       );

//     if (!confirmed) {
//       return;
//     }

//     setError("");
//     setSuccess("");

//     try {
//       await api.delete(
//         `/jobs/${job.job_id}`
//       );

//       await refreshJobs();

//       setSuccess(
//         `"${job.project_name}" was retired successfully.`
//       );
//     } catch (requestError) {
//       setError(
//         requestError.response?.data?.message ||
//           "Unable to retire the job. Please try again."
//       );
//     }
//   };

//   // ==========================================
//   // JOB STATUS
//   // ==========================================
//   const getJobStatus = (job) => {
//     if (job.is_enabled) {
//       return "Active";
//     }

//     if (
//       String(
//         job.disable_reason || ""
//       ).toLowerCase() === "retired"
//     ) {
//       return "Retired";
//     }

//     return "Inactive";
//   };

//   // ==========================================
//   // LOADING
//   // ==========================================
//   if (loading) {
//     return (
//       <>
//         <Sidebar />

//         <div className="main-content">
//           <Navbar />

//           <div className="job-container">
//             <p>Loading jobs...</p>
//           </div>
//         </div>
//       </>
//     );
//   }

//   // ==========================================
//   // PAGE
//   // ==========================================
//   return (
//     <>
//       <Sidebar />

//       <div className="main-content">
//         <Navbar />

//         <div className="job-container">
//           {/* HEADER */}
//           <div className="job-header">
//             <div>
//               <h2>Job Master</h2>

//               <p>
//                 Configure customer file
//                 retention policies.
//               </p>
//             </div>

//             <button
//               className="add-btn"
//               onClick={openAddForm}
//             >
//               + Add Job
//             </button>
//           </div>

//           {/* SUCCESS */}
//           {success && (
//             <div
//               className="success-message"
//               role="status"
//             >
//               {success}
//             </div>
//           )}

//           {/* ERROR */}
//           {error && (
//             <div
//               className="error-message"
//               role="alert"
//             >
//               {error}
//             </div>
//           )}

//           {/* SEARCH */}
//           <div className="search-box">
//             <input
//               type="search"
//               placeholder="Search Job..."
//               value={search}
//               onChange={(event) =>
//                 setSearch(
//                   event.target.value
//                 )
//               }
//             />
//           </div>

//           {/* JOB TABLE */}
//           <table className="job-table">
//             <thead>
//               <tr>
//                 <th>Job ID</th>
//                 <th>Customer</th>
//                 <th>Project</th>
//                 <th>Folder Path</th>
//                 <th>File Type</th>
//                 <th>Retention</th>
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filteredJobs.length > 0 ? (
//                 filteredJobs.map((job) => {
//                   const status =
//                     getJobStatus(job);

//                   return (
//                     <tr key={job.job_id}>
//                       <td>
//                         {job.job_id}
//                       </td>

//                       <td>
//                         {job.customer_name ||
//                           "-"}
//                       </td>

//                       <td>
//                         {job.project_name ||
//                           "-"}
//                       </td>

//                       <td>
//                         {job.folder_path ||
//                           "-"}
//                       </td>

//                       <td>
//                         {job.file_type ||
//                           "-"}
//                       </td>

//                       <td>
//                         {job.retention_hours}{" "}
//                         hrs
//                       </td>

//                       <td>
//                         <span
//                           className={
//                             status ===
//                             "Active"
//                               ? "status-active"
//                               : "status-inactive"
//                           }
//                         >
//                           {status}
//                         </span>
//                       </td>

//                       <td>
//                         <button
//                           className="edit-btn"
//                           onClick={() =>
//                             editJob(job)
//                           }
//                         >
//                           Edit
//                         </button>

//                         {job.is_enabled ? (
//                           <button
//                             className="delete-btn"
//                             onClick={() =>
//                               retireJob(job)
//                             }
//                           >
//                             Retire
//                           </button>
//                         ) : (
//                           <button
//                             className="delete-btn"
//                             disabled
//                             title={
//                               status ===
//                               "Retired"
//                                 ? "This job has already been retired."
//                                 : "This job is inactive."
//                             }
//                           >
//                             {status ===
//                             "Retired"
//                               ? "Retired"
//                               : "Inactive"}
//                           </button>
//                         )}
//                       </td>
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan="8">
//                     No jobs found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>

//           {/* ADD / EDIT POPUP */}
//           {showForm && (
//             <div className="popup">
//               <form
//                 className="popup-content"
//                 onSubmit={saveJob}
//               >
//                 <h2>
//                   {editingId !== null
//                     ? "Edit Job"
//                     : "Add Job"}
//                 </h2>

//                 {/* CUSTOMER */}
//                 <label>
//                   Customer
//                 </label>

//                 <select
//                   value={
//                     newJob.customer_id
//                   }
//                   onChange={(event) => {
//                     const selectedId =
//                       event.target.value;

//                     const selectedCustomer =
//                       customers.find(
//                         (customer) =>
//                           String(
//                             customer.customer_id ??
//                               customer.id
//                           ) ===
//                           selectedId
//                       );

//                     const customerName =
//                       selectedCustomer
//                         ?.customer_name ||
//                       selectedCustomer?.name ||
//                       "";

//                     setNewJob(
//                       (previous) => ({
//                         ...previous,

//                         customer_id:
//                           selectedId,

//                         customer_name:
//                           customerName,

//                         folder_path:
//                           selectedCustomer
//                             ? `D:/Retention/${customerName}`
//                             : "",
//                       })
//                     );
//                   }}
//                   required
//                 >
//                   <option value="">
//                     Select Customer
//                   </option>

//                   {customers.map(
//                     (customer) => {
//                       const id =
//                         customer.customer_id ??
//                         customer.id;

//                       const name =
//                         customer.customer_name ||
//                         customer.name;

//                       return (
//                         <option
//                           key={id}
//                           value={id}
//                         >
//                           {name}
//                         </option>
//                       );
//                     }
//                   )}
//                 </select>

//                 {/* PROJECT */}
//                 <label>
//                   Project Name
//                 </label>

//                 <input
//                   type="text"
//                   placeholder="Project Name"
//                   value={
//                     newJob.project_name
//                   }
//                   onChange={(event) =>
//                     setNewJob(
//                       (previous) => ({
//                         ...previous,
//                         project_name:
//                           event.target
//                             .value,
//                       })
//                     )
//                   }
//                   required
//                 />

//                 {/* FOLDER */}
//                 <label>
//                   Folder Path
//                 </label>

//                 <input
//                   type="text"
//                   value={
//                     newJob.folder_path
//                   }
//                   readOnly
//                 />

//                 {/* FILE TYPE */}
//                 <label>
//                   File Type
//                 </label>

//                 <select
//                   value={
//                     newJob.file_type
//                   }
//                   onChange={(event) =>
//                     setNewJob(
//                       (previous) => ({
//                         ...previous,
//                         file_type:
//                           event.target
//                             .value,
//                       })
//                     )
//                   }
//                   required
//                 >
//                   {FILE_TYPES.map(
//                     (type) => (
//                       <option
//                         key={type}
//                         value={type}
//                       >
//                         {type}
//                       </option>
//                     )
//                   )}
//                 </select>

//                 {/* RETENTION */}
//                 <label>
//                   Retention Hours
//                 </label>

//                 <input
//                   type="number"
//                   min="1"
//                   step="1"
//                   placeholder="Retention Hours"
//                   value={
//                     newJob.retention_hours
//                   }
//                   onChange={(event) =>
//                     setNewJob(
//                       (previous) => ({
//                         ...previous,
//                         retention_hours:
//                           event.target
//                             .value,
//                       })
//                     )
//                   }
//                   required
//                 />

//                 {/* STATUS */}
//                 <label>
//                   Status
//                 </label>

//                 <select
//                   value={
//                     newJob.is_enabled
//                       ? "Active"
//                       : "Inactive"
//                   }
//                   onChange={(event) =>
//                     setNewJob(
//                       (previous) => {
//                         const enabled =
//                           event.target
//                             .value ===
//                           "Active";

//                         return {
//                           ...previous,

//                           is_enabled:
//                             enabled,

//                           disable_reason:
//                             enabled
//                               ? ""
//                               : previous.disable_reason,
//                         };
//                       }
//                     )
//                   }
//                 >
//                   <option value="Active">
//                     Active
//                   </option>

//                   <option value="Inactive">
//                     Inactive
//                   </option>
//                 </select>

//                 {/* DISABLE REASON */}
//                 {!newJob.is_enabled && (
//                   <>
//                     <label>
//                       Disable Reason
//                     </label>

//                     <input
//                       type="text"
//                       placeholder="Reason for disabling"
//                       value={
//                         newJob.disable_reason
//                       }
//                       onChange={(event) =>
//                         setNewJob(
//                           (previous) => ({
//                             ...previous,
//                             disable_reason:
//                               event.target
//                                 .value,
//                           })
//                         )
//                       }
//                     />
//                   </>
//                 )}

//                 {/* EXCLUDE FOLDER */}
//                 <label>
//                   <input
//                     type="checkbox"
//                     checked={
//                       newJob.exclude_folder
//                     }
//                     onChange={(event) =>
//                       setNewJob(
//                         (previous) => ({
//                           ...previous,
//                           exclude_folder:
//                             event.target
//                               .checked,
//                         })
//                       )
//                     }
//                   />

//                   {" "}
//                   Exclude Folder
//                 </label>

//                 {/* BUTTONS */}
//                 <div className="popup-buttons">
//                   <button
//                     type="submit"
//                     disabled={saving}
//                   >
//                     {saving
//                       ? "Saving..."
//                       : editingId !==
//                           null
//                         ? "Update"
//                         : "Save"}
//                   </button>

//                   <button
//                     type="button"
//                     onClick={resetForm}
//                     disabled={saving}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// export default JobMaster;


import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

import "../styles/jobMaster.css";

const FILE_TYPES = [
  "XML",
  "PDF",
  "XLSX",
  "CSV",
  "TXT",
];

const emptyJob = {
  customer_id: "",
  customer_name: "",
  project_name: "",
  folder_path: "",
  file_type: "XML",
  retention_hours: "",
  is_enabled: true,
  disable_reason: "",
  exclude_folder: false,
};

// ==================================================
// HELPERS
// ==================================================

function rowsFrom(response) {
  return Array.isArray(response?.data?.data)
    ? response.data.data
    : [];
}

function apiMessage(error, fallback) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    fallback
  );
}

function isEnabled(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true"
  );
}

function isCustomerActive(customer) {
  return (
    customer.status === "Active" ||
    customer.status === true ||
    customer.status === 1 ||
    customer.status === "1" ||
    customer.status_flag === 1 ||
    customer.status_flag === "1"
  );
}

// ==================================================
// COMPONENT
// ==================================================

function JobMaster() {
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [statusChangingId, setStatusChangingId] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [newJob, setNewJob] = useState({
    ...emptyJob,
  });

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          jobsResponse,
          customersResponse,
        ] = await Promise.all([
          api.get("/jobs"),
          api.get("/customers"),
        ]);

        if (!active) {
          return;
        }

        setJobs(
          rowsFrom(jobsResponse)
        );

        setCustomers(
          rowsFrom(customersResponse)
        );
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (
          requestError.response?.status ===
          401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          window.location.href = "/";
          return;
        }

        setError(
          apiMessage(
            requestError,
            requestError.response?.status ===
              403
              ? "You do not have permission to view Job Master."
              : "Unable to load Job Master."
          )
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // ==================================================
  // REFRESH
  // ==================================================

  const refreshJobs = async () => {
    const response =
      await api.get("/jobs");

    setJobs(
      rowsFrom(response)
    );
  };

  // ==================================================
  // SEARCH
  // ==================================================

  const filteredJobs = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return jobs;
    }

    return jobs.filter((job) =>
      [
        job.job_id,
        job.customer_name,
        job.project_name,
        job.folder_path,
        job.file_type,
        job.retention_hours,
        job.disable_reason,
      ]
        .filter(
          (item) =>
            item !== null &&
            item !== undefined
        )
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [jobs, search]);

  // ==================================================
  // JOB STATUS
  // ==================================================

  const getJobStatus = (job) => {
    return isEnabled(job.is_enabled)
      ? "Active"
      : "Disabled";
  };

  // ==================================================
  // CUSTOMERS AVAILABLE FOR JOB CREATION
  // ==================================================

  const selectableCustomers = useMemo(() => {
    return customers.filter(
      (customer) => {
        const customerId =
          customer.customer_id ??
          customer.id;

        /*
         * New jobs should normally use
         * active customers only.
         *
         * While editing, keep the currently
         * selected customer available.
         */
        return (
          isCustomerActive(customer) ||
          String(customerId) ===
            String(
              newJob.customer_id
            )
        );
      }
    );
  }, [
    customers,
    newJob.customer_id,
  ]);

  // ==================================================
  // RESET FORM
  // ==================================================

  const resetForm = () => {
    setEditingId(null);

    setNewJob({
      ...emptyJob,
    });

    setShowForm(false);
  };

  // ==================================================
  // OPEN ADD FORM
  // ==================================================

  const openAddForm = () => {
    setError("");
    setSuccess("");

    setEditingId(null);

    setNewJob({
      ...emptyJob,
    });

    setShowForm(true);
  };

  // ==================================================
  // OPEN EDIT FORM
  // ==================================================

  const editJob = (job) => {
    setError("");
    setSuccess("");

    const type = String(
      job.file_type || "XML"
    ).toUpperCase();

    setEditingId(
      job.job_id
    );

    setNewJob({
      customer_id:
        job.customer_id === null ||
        job.customer_id === undefined
          ? ""
          : String(
              job.customer_id
            ),

      customer_name:
        job.customer_name || "",

      project_name:
        job.project_name || "",

      folder_path:
        job.folder_path || "",

      file_type:
        FILE_TYPES.includes(type)
          ? type
          : "XML",

      retention_hours:
        job.retention_hours === null ||
        job.retention_hours === undefined
          ? ""
          : String(
              job.retention_hours
            ),

      is_enabled:
        isEnabled(
          job.is_enabled
        ),

      disable_reason:
        job.disable_reason || "",

      exclude_folder:
        Boolean(
          job.exclude_folder
        ),
    });

    setShowForm(true);
  };

  // ==================================================
  // SAVE / UPDATE JOB
  // ==================================================

  const saveJob = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ------------------------------------------
    // CUSTOMER VALIDATION
    // ------------------------------------------

    if (!newJob.customer_id) {
      setError(
        "Please select a customer."
      );

      return;
    }

    const customerId =
      Number(
        newJob.customer_id
      );

    if (
      !Number.isSafeInteger(
        customerId
      ) ||
      customerId <= 0
    ) {
      setError(
        "Invalid customer selection."
      );

      return;
    }

    // ------------------------------------------
    // PROJECT VALIDATION
    // ------------------------------------------

    if (
      !newJob.project_name.trim()
    ) {
      setError(
        "Project name is required."
      );

      return;
    }

    // ------------------------------------------
    // FOLDER VALIDATION
    // ------------------------------------------

    // ------------------------------------------
    // FILE TYPE VALIDATION
    // ------------------------------------------

    const fileType =
      String(
        newJob.file_type
      ).toUpperCase();

    if (
      !FILE_TYPES.includes(
        fileType
      )
    ) {
      setError(
        "Please select a valid file type."
      );

      return;
    }

    // ------------------------------------------
    // RETENTION VALIDATION
    // ------------------------------------------

    const retentionHours =
      Number(
        newJob.retention_hours
      );

    if (
      !Number.isInteger(
        retentionHours
      ) ||
      retentionHours <= 0
    ) {
      setError(
        "Retention hours must be a positive whole number."
      );

      return;
    }

    // ------------------------------------------
    // DISABLE REASON VALIDATION
    // ------------------------------------------

    if (
      !newJob.is_enabled &&
      !newJob.disable_reason.trim()
    ) {
      setError(
        "Disable reason is required when a job is disabled."
      );

      return;
    }

    // ------------------------------------------
    // PAYLOAD
    // ------------------------------------------

const payload = {
  customer_id:
    customerId,

  project_name:
    newJob.project_name.trim(),

  folder_path:
    newJob.folder_path.trim(),

  file_type:
    fileType,

  retention_hours:
    retentionHours,

  is_enabled:
    Boolean(
      newJob.is_enabled
    ),

  disable_reason:
    newJob.is_enabled
      ? null
      : newJob.disable_reason.trim(),

  exclude_folder:
    Boolean(
      newJob.exclude_folder
    ),
};

    setSaving(true);

    // ------------------------------------------
    // CREATE / UPDATE API
    // ------------------------------------------

    try {
      if (
        editingId !== null
      ) {
        await api.patch(
          `/jobs/${editingId}`,
          payload
        );

        setSuccess(
          "Job updated successfully."
        );
      } else {
        await api.post(
          "/jobs",
          payload
        );

        setSuccess(
          "Job created successfully."
        );
      }

      resetForm();
    } catch (requestError) {
      setError(
        apiMessage(
          requestError,
          editingId !== null
            ? "Unable to update the job."
            : "Unable to create the job."
        )
      );

      setSaving(false);

      return;
    }

    // ------------------------------------------
    // REFRESH AFTER SUCCESS
    // ------------------------------------------

    try {
      await refreshJobs();
    } catch {
      setError(
        "The job was saved successfully, but the job list could not be refreshed. Refresh the page to see the latest data."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // ENABLE / DISABLE JOB
  // ==================================================

  const changeJobStatus = async (
    job,
    enable
  ) => {
    const currentStatus =
      getJobStatus(job);

    // ------------------------------------------
    // ALREADY ACTIVE
    // ------------------------------------------

    if (
      enable &&
      currentStatus === "Active"
    ) {
      setError(
        "This job is already active."
      );

      return;
    }

    // ------------------------------------------
    // ALREADY DISABLED
    // ------------------------------------------

    if (
      !enable &&
      currentStatus === "Disabled"
    ) {
      setError(
        "This job is already disabled."
      );

      return;
    }

    // ------------------------------------------
    // CONFIRMATION
    // ------------------------------------------

    const confirmed =
      window.confirm(
        enable
          ? `Activate "${job.project_name}"?\n\nThe retention worker will process this job again on the next run.`
          : `Disable "${job.project_name}"?\n\nThe job will remain in the database and audit history, but the retention worker will skip it until it is activated again.`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    setStatusChangingId(
      job.job_id
    );

    // ------------------------------------------
    // STATUS API
    // ------------------------------------------

    try {
      await api.patch(
        `/jobs/${job.job_id}/status`,
        {
          is_enabled:
            enable,

          reason:
            enable
              ? "Activated by administrator"
              : "Disabled by administrator",
        }
      );
    } catch (requestError) {
      setError(
        apiMessage(
          requestError,
          enable
            ? "Unable to activate the job."
            : "Unable to disable the job."
        )
      );

      setStatusChangingId(null);

      return;
    }

    // ------------------------------------------
    // SUCCESS
    // ------------------------------------------

    setSuccess(
      `"${job.project_name}" was ${
        enable
          ? "activated"
          : "disabled"
      } successfully.`
    );

    // ------------------------------------------
    // REFRESH
    // ------------------------------------------

    try {
      await refreshJobs();
    } catch {
      setError(
        `The job was ${
          enable
            ? "activated"
            : "disabled"
        } successfully, but the job list could not be refreshed. Refresh the page to see the latest status.`
      );
    } finally {
      setStatusChangingId(null);
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <>
        <Sidebar />

        <div className="main-content">
          <Navbar />

          <div className="job-container">
            <p>
              Loading jobs...
            </p>
          </div>
        </div>
      </>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <>
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="job-container">

          {/* ========================================
              HEADER
          ======================================== */}

          <div className="job-header">
            <div>
              <h2>
                Job Master
              </h2>

              <p>
                Configure customer file
                retention policies.
              </p>
            </div>

            <button
              className="add-btn"
              onClick={openAddForm}
            >
              + Add Job
            </button>
          </div>

          {/* ========================================
              SUCCESS MESSAGE
          ======================================== */}

          {success && (
            <div
              className="success-message"
              role="status"
            >
              {success}
            </div>
          )}

          {/* ========================================
              ERROR MESSAGE
          ======================================== */}

          {error && (
            <div
              className="error-message"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* ========================================
              SEARCH
          ======================================== */}

          <div className="search-box">
            <input
              type="search"
              placeholder="Search Job..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          {/* ========================================
              JOB TABLE
          ======================================== */}

          <table className="job-table">

            <thead>
              <tr>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Project</th>
                <th>Folder Path</th>
                <th>File Type</th>
                <th>Retention</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredJobs.length > 0 ? (
                filteredJobs.map(
                  (job) => {
                    const status =
                      getJobStatus(
                        job
                      );

                    const changing =
                      statusChangingId ===
                      job.job_id;

                    return (
                      <tr
                        key={
                          job.job_id
                        }
                      >

                        {/* JOB ID */}

                        <td>
                          {
                            job.job_id
                          }
                        </td>

                        {/* CUSTOMER */}

                        <td>
                          {job.customer_name ||
                            "-"}
                        </td>

                        {/* PROJECT */}

                        <td>
                          {job.project_name ||
                            "-"}
                        </td>

                        {/* FOLDER */}

                        <td>
                          {job.folder_path ||
                            "-"}
                        </td>

                        {/* FILE TYPE */}

                        <td>
                          {job.file_type ||
                            "-"}
                        </td>

                        {/* RETENTION */}

                        <td>
                          {
                            job.retention_hours
                          }{" "}
                          hrs
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={
                              status ===
                              "Active"
                                ? "status-active"
                                : "status-inactive"
                            }
                          >
                            {status}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td>

                          <button
                            className="edit-btn"
                            disabled={
                              changing
                            }
                            onClick={() =>
                              editJob(
                                job
                              )
                            }
                          >
                            Edit
                          </button>

                          {status ===
                          "Active" ? (
                            <button
                              className="delete-btn"
                              disabled={
                                changing
                              }
                              onClick={() =>
                                changeJobStatus(
                                  job,
                                  false
                                )
                              }
                            >
                              {changing
                                ? "Disabling..."
                                : "Disable"}
                            </button>
                          ) : (
                            <button
                              className="edit-btn"
                              disabled={
                                changing
                              }
                              onClick={() =>
                                changeJobStatus(
                                  job,
                                  true
                                )
                              }
                            >
                              {changing
                                ? "Activating..."
                                : "Activate"}
                            </button>
                          )}

                        </td>

                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td colSpan="8">
                    No jobs found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

          {/* ========================================
              ADD / EDIT POPUP
          ======================================== */}

          {showForm && (
            <div className="popup">

              <form
                className="popup-content"
                onSubmit={saveJob}
              >

                <h2>
                  {editingId !== null
                    ? "Edit Job"
                    : "Add Job"}
                </h2>

                {/* CUSTOMER */}

                <label>
                  Customer
                </label>

                <select
                  value={
                    newJob.customer_id
                  }
                  onChange={(event) => {
                    const selectedId =
                      event.target.value;

                    const selectedCustomer =
                      customers.find(
                        (customer) =>
                          String(
                            customer.customer_id ??
                              customer.id
                          ) ===
                          selectedId
                      );

                    const customerName =
                      selectedCustomer
                        ?.customer_name ||
                      selectedCustomer
                        ?.name ||
                      "";

                    setNewJob(
                      (current) => ({
                        ...current,

                        customer_id:
                          selectedId,

                        customer_name:
                          customerName,

                       folder_path:
  selectedCustomer?.folder_path || "",
                      })
                    );
                  }}
                  
                >
                  <option value="">
                    Select Customer
                  </option>

                  {selectableCustomers.map(
                    (customer) => {
                      const customerId =
                        customer.customer_id ??
                        customer.id;

                      const customerName =
                        customer.customer_name ||
                        customer.name;

                      return (
                        <option
                          key={
                            customerId
                          }
                          value={
                            customerId
                          }
                        >
                          {
                            customerName
                          }
                        </option>
                      );
                    }
                  )}

                </select>

                {/* PROJECT */}

                <label>
                  Project Name
                </label>

<input
  type="text"
  placeholder="Project Name"
  value={newJob.project_name}
  onChange={(event) =>
    setNewJob((current) => ({
      ...current,
      project_name: event.target.value,
    }))
  }
/>

                {/* FOLDER */}

                <label>
                  Folder Path
                </label>

                <input
                  type="text"
                  value={
                    newJob.folder_path
                  }
                  readOnly
                />

                {/* FILE TYPE */}

                <label>
                  File Type
                </label>

                <select
                  value={
                    newJob.file_type
                  }
                  onChange={(event) =>
                    setNewJob(
                      (current) => ({
                        ...current,

                        file_type:
                          event.target.value,
                      })
                    )
                  }
                  
                >
                  {FILE_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    )
                  )}
                </select>

                {/* RETENTION */}

                <label>
                  Retention Hours
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Retention Hours"
                  value={
                    newJob.retention_hours
                  }
                  onChange={(event) =>
                    setNewJob(
                      (current) => ({
                        ...current,

                        retention_hours:
                          event.target.value,
                      })
                    )
                  }
                  
                />

                {/* STATUS */}

                <label>
                  Status
                </label>

                <select
                  value={
                    newJob.is_enabled
                      ? "Active"
                      : "Disabled"
                  }
                  onChange={(event) => {
                    const enabled =
                      event.target.value ===
                      "Active";

                    setNewJob(
                      (current) => ({
                        ...current,

                        is_enabled:
                          enabled,

                        disable_reason:
                          enabled
                            ? ""
                            : current.disable_reason,
                      })
                    );
                  }}
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Disabled">
                    Disabled
                  </option>

                </select>

                {/* DISABLE REASON */}

                {!newJob.is_enabled && (
                  <>
                    <label>
                      Disable Reason
                    </label>

                    <input
                      type="text"
                      placeholder="Reason for disabling"
                      value={
                        newJob.disable_reason
                      }
                      onChange={(event) =>
                        setNewJob(
                          (current) => ({
                            ...current,

                            disable_reason:
                              event.target.value,
                          })
                        )
                      }
                      
                    />
                  </>
                )}

                {/* EXCLUDE FOLDER */}

                <label>
                  <input
                    type="checkbox"
                    checked={
                      newJob.exclude_folder
                    }
                    onChange={(event) =>
                      setNewJob(
                        (current) => ({
                          ...current,

                          exclude_folder:
                            event.target.checked,
                        })
                      )
                    }
                  />

                  {" "}
                  Exclude Folder
                </label>

                {/* BUTTONS */}

                <div className="popup-buttons">

                  <button
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update"
                        : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default JobMaster;